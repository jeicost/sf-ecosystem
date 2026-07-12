"""JWT auth — DB-backed users with roles: admin | editor | influencer."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.db.models import UserRow
from app.services import email as email_svc

router = APIRouter(prefix="/v2/auth", tags=["auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v2/auth/token")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    name: str
    role: str
    status: str


class TokenData(BaseModel):
    user_id: str
    email: str
    role: str
    status: str = "active"


class InfluencerRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    ig_handle: Optional[str] = None
    ig_followers: Optional[int] = None
    application_notes: Optional[str] = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    status: str
    ig_handle: Optional[str]
    ig_followers: Optional[int]
    applied_at: Optional[datetime]
    approved_at: Optional[datetime]
    approved_by: Optional[str]
    rejection_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class RejectRequest(BaseModel):
    rejection_reason: Optional[str] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    ig_handle: Optional[str] = None
    ig_followers: Optional[int] = None
    bio: Optional[str] = None


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _create_token(user_id: str, email: str, role: str, user_status: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": email, "uid": user_id, "role": role, "status": user_status, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """Stateless JWT decode — no DB hit required."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        role: str = payload.get("role", "editor")
        user_id: str = payload.get("uid", "")
        user_status: str = payload.get("status", "active")
        if email is None:
            raise credentials_exception
        return TokenData(user_id=user_id, email=email, role=role, status=user_status)
    except JWTError:
        raise credentials_exception


def require_admin(current: TokenData = Depends(get_current_user)) -> TokenData:
    if current.role != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol admin")
    return current


def require_editor_or_admin(current: TokenData = Depends(get_current_user)) -> TokenData:
    if current.role not in ("editor", "admin"):
        raise HTTPException(status_code=403, detail="Se requiere rol editor o admin")
    return current


def require_active(current: TokenData = Depends(get_current_user)) -> TokenData:
    """Blocks pending/rejected influencers from accessing protected resources."""
    if current.status != "active":
        raise HTTPException(
            status_code=403,
            detail="Cuenta pendiente de aprobación. Te avisaremos por email cuando esté lista.",
        )
    return current


# ── Auth endpoints ────────────────────────────────────────────────────────────

@router.post("/token", response_model=Token)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserRow).where(UserRow.email == form.username))
    user = result.scalar_one_or_none()

    if not user or not pwd_ctx.verify(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = _create_token(str(user.id), user.email, user.role, user.status)
    return Token(
        access_token=token,
        token_type="bearer",
        name=user.name,
        role=user.role,
        status=user.status,
    )


@router.get("/me", response_model=UserOut)
async def me(
    current: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserRow).where(UserRow.email == current.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.post("/logout")
async def logout():
    return {"message": "Sesión cerrada"}


# ── Influencer registration ───────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register_influencer(
    data: InfluencerRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — influencer applies for access.
    Creates user with status=pending; admin must approve before they can log in fully.
    """
    result = await db.execute(select(UserRow).where(UserRow.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Este email ya está registrado")

    user = UserRow(
        email=data.email,
        name=data.name,
        hashed_password=pwd_ctx.hash(data.password),
        role="influencer",
        status="pending",
        ig_handle=data.ig_handle,
        ig_followers=data.ig_followers,
        application_notes=data.application_notes,
        applied_at=datetime.utcnow(),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    import asyncio
    asyncio.create_task(email_svc.send_registration_confirmation(user.email, user.name))
    asyncio.create_task(email_svc.send_admin_new_application(
        admin_email=settings.admin_email,
        applicant_name=user.name,
        applicant_email=user.email,
        ig_handle=user.ig_handle,
    ))

    return {
        "message": "Solicitud recibida. Nuestro equipo está validando tu perfil y te avisaremos por email.",
        "user_id": str(user.id),
    }


# ── Editor/Admin: list users by role ──────────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role: influencer|editor|admin"),
    status: Optional[str] = Query(None, description="Filter by status: active|pending|rejected"),
    db: AsyncSession = Depends(get_db),
    _: TokenData = Depends(require_editor_or_admin),
):
    """List users. Editors can list influencers; admins can list all."""
    q = select(UserRow)
    if role:
        q = q.where(UserRow.role == role)
    if status:
        q = q.where(UserRow.status == status)
    q = q.order_by(UserRow.created_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())


# ── Admin: manage applications ────────────────────────────────────────────────

@router.get("/applications", response_model=list[UserOut])
async def list_applications(
    status_filter: Optional[str] = Query("pending", alias="status"),
    db: AsyncSession = Depends(get_db),
    _: TokenData = Depends(require_admin),
):
    """List influencer applications. status=pending|active|rejected|all"""
    q = select(UserRow).where(UserRow.role == "influencer")
    if status_filter and status_filter != "all":
        q = q.where(UserRow.status == status_filter)
    q = q.order_by(UserRow.applied_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/applications/{user_id}/approve")
async def approve_application(
    user_id: uuid.UUID,
    current: TokenData = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserRow).where(UserRow.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.status != "pending":
        raise HTTPException(status_code=400, detail=f"El usuario ya tiene status: {user.status}")

    user.status = "active"
    user.approved_at = datetime.utcnow()
    user.approved_by = current.email
    await db.flush()

    import asyncio
    asyncio.create_task(email_svc.send_approval_email(
        user.email, user.name, portal_url=settings.portal_url
    ))
    return {"message": f"Usuario {user.email} aprobado y activado"}


@router.post("/applications/{user_id}/reject")
async def reject_application(
    user_id: uuid.UUID,
    data: RejectRequest,
    _: TokenData = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserRow).where(UserRow.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.status = "rejected"
    user.rejection_reason = data.rejection_reason
    await db.flush()

    import asyncio
    asyncio.create_task(email_svc.send_rejection_email(
        user.email, user.name, reason=data.rejection_reason
    ))
    return {"message": f"Solicitud de {user.email} rechazada"}


# ── Self-service profile update ────────────────────────────────────────────────

@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdateRequest,
    current: TokenData = Depends(require_active),
    db: AsyncSession = Depends(get_db),
):
    """Influencer (or any active user) updates their own profile fields."""
    result = await db.execute(select(UserRow).where(UserRow.email == current.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.name is not None:
        user.name = data.name.strip()
    if data.ig_handle is not None:
        user.ig_handle = data.ig_handle.lstrip("@").strip() or None
    if data.ig_followers is not None:
        user.ig_followers = data.ig_followers
    if data.bio is not None:
        user.bio = data.bio.strip() or None

    user.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(user)
    return user


# ── CMS bridge ────────────────────────────────────────────────────────────────

class CMSLoginRequest(BaseModel):
    cms_token: str


@router.post("/cms-login", response_model=Token)
async def cms_login(body: CMSLoginRequest):
    """Exchange a Discoolver CMS JWT for an editor JWT."""
    import httpx

    if not settings.cms_base_url:
        raise HTTPException(status_code=503, detail="CMS bridge no configurado.")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            headers = {"Authorization": f"Bearer {body.cms_token}"}
            if settings.cms_api_key:
                headers["X-API-Key"] = settings.cms_api_key
            resp = await client.get(
                f"{settings.cms_base_url.rstrip('/')}/api/me",
                headers=headers,
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"No se pudo contactar el CMS: {exc}")

    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Token CMS inválido o expirado")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"CMS devolvió {resp.status_code}")

    cms_user = resp.json()
    email = cms_user.get("email") or cms_user.get("correo") or cms_user.get("username")
    name = cms_user.get("name") or cms_user.get("nombre") or cms_user.get("fullName") or email
    cms_role = str(cms_user.get("role") or cms_user.get("rol") or "").lower()
    role = "admin" if "admin" in cms_role else "editor"

    if not email:
        raise HTTPException(status_code=502, detail="El CMS no devolvió un email de usuario")

    token = _create_token("", email, role, "active")
    return Token(access_token=token, token_type="bearer", name=name, role=role, status="active")
