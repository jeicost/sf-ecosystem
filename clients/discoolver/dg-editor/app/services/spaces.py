"""Cloudflare R2 storage client (S3-compatible via boto3).
All files are stored under the /files prefix inside the configured bucket.
"""
import mimetypes
import uuid
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from app.config import settings

_LOCAL_MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / "static" / "generated"

# Top-level prefix for all uploaded files inside the bucket
_FILES_PREFIX = "files"


def _use_local() -> bool:
    return not settings.do_spaces_key or not settings.do_spaces_secret


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.do_spaces_endpoint,
        aws_access_key_id=settings.do_spaces_key,
        aws_secret_access_key=settings.do_spaces_secret,
        # R2 uses auto region — no region_name needed
    )


def upload_file(
    file_bytes: bytes,
    original_filename: str,
    guide_id: str,
    folder: str = "guides",
) -> dict:
    """
    Upload file to Cloudflare R2 (or local /static/generated/ when R2 not configured).
    Returns { storage_key, url, cdn_url, mime_type, size_bytes }
    """
    ext = Path(original_filename).suffix.lower()
    mime_type = mimetypes.guess_type(original_filename)[0] or "application/octet-stream"
    # All keys live under /files/{folder}/{guide_id}/{uuid}{ext}
    storage_key = f"{_FILES_PREFIX}/{folder}/{guide_id}/{uuid.uuid4().hex}{ext}"

    if _use_local():
        dest = _LOCAL_MEDIA_DIR / guide_id
        dest.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"
        (dest / filename).write_bytes(file_bytes)
        local_key = f"{guide_id}/{filename}"
        url = f"http://localhost:{settings.port}/static/generated/{local_key}"
        return {
            "storage_key": local_key,
            "url": url,
            "cdn_url": url,
            "mime_type": mime_type,
            "size_bytes": len(file_bytes),
            "original_filename": original_filename,
        }

    client = _client()
    # R2 does not support per-object ACLs — bucket-level public access is set in CF dashboard
    client.put_object(
        Bucket=settings.do_spaces_bucket,
        Key=storage_key,
        Body=file_bytes,
        ContentType=mime_type,
        CacheControl="max-age=31536000",
    )

    # Public URL: use CDN domain if set, otherwise fall back to R2 endpoint path
    base_url = f"{settings.do_spaces_endpoint}/{settings.do_spaces_bucket}"
    url = f"{base_url}/{storage_key}"
    cdn_url = f"{settings.do_spaces_cdn_base}/{storage_key}" if settings.do_spaces_cdn_base else url

    return {
        "storage_key": storage_key,
        "url": url,
        "cdn_url": cdn_url,
        "mime_type": mime_type,
        "size_bytes": len(file_bytes),
        "original_filename": original_filename,
    }


def delete_file(storage_key: str) -> bool:
    try:
        _client().delete_object(Bucket=settings.do_spaces_bucket, Key=storage_key)
        return True
    except ClientError:
        return False


def get_public_url(storage_key: str, use_cdn: bool = True) -> str:
    if use_cdn and settings.do_spaces_cdn_base:
        return f"{settings.do_spaces_cdn_base}/{storage_key}"
    base = f"{settings.do_spaces_endpoint}/{settings.do_spaces_bucket}"
    return f"{base}/{storage_key}"
