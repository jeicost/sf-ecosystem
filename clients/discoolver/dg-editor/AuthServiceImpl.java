package com.discoolver.guides.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Implementación de AuthService
 * STUB: Adaptar con tu JWT library (auth0, jjwt, etc)
 *
 * Opciones:
 * 1. Auth0: com.auth0:java-jwt:4.x (JWT parsing)
 * 2. JJWT: io.jsonwebtoken:jjwt:0.11.x (JWT sign/verify)
 * 3. Spring Security + JWT: org.springframework.security:spring-security-jwt:1.1.1
 */
@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    /**
     * TODO: Adaptar con tu JWT library
     *
     * Ejemplo con JJWT:
     * ─────────────────────────────────────────────────────────────────────
     *
     * @Override
     * public Long extractUserIdFromToken(String token) {
     *     try {
     *         // Remover "Bearer " del header
     *         String jwtToken = token.replace("Bearer ", "");
     *
     *         // Parsear JWT con tu secret key
     *         Claims claims = Jwts.parserBuilder()
     *             .setSigningKey(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()))
     *             .build()
     *             .parseClaimsJws(jwtToken)
     *             .getBody();
     *
     *         // Extraer userId del claim
     *         return claims.get("userId", Long.class);
     *     } catch (ExpiredJwtException e) {
     *         throw new UnauthorizedException("Token expirado");
     *     } catch (JwtException e) {
     *         throw new UnauthorizedException("Token inválido");
     *     }
     * }
     *
     * ─────────────────────────────────────────────────────────────────────
     *
     * Ejemplo con Auth0:
     * ─────────────────────────────────────────────────────────────────────
     *
     * @Override
     * public Long extractUserIdFromToken(String token) {
     *     try {
     *         String jwtToken = token.replace("Bearer ", "");
     *         DecodedJWT decoded = JWT.require(Algorithm.HMAC256(SECRET))
     *             .build()
     *             .verify(jwtToken);
     *
     *         return decoded.getClaim("userId").asLong();
     *     } catch (JWTVerificationException e) {
     *         throw new UnauthorizedException("Token inválido o expirado");
     *     }
     * }
     *
     * ─────────────────────────────────────────────────────────────────────
     */
    @Override
    public Long extractUserIdFromToken(String token) {
        log.warn("AuthServiceImpl.extractUserIdFromToken() — STUB not implemented");
        log.info("TODO: Implementar con tu JWT library (jjwt, auth0, etc)");

        // STUB: Retornar ID de ejemplo para testing
        // En producción: parsear y validar JWT
        try {
            String jwtToken = token.replace("Bearer ", "");
            // TODO: Reemplazar con lógica real
            if (jwtToken.isEmpty()) {
                throw new RuntimeException("Token vacío");
            }
            // Por ahora, retornar 1 (testing)
            return 1L;
        } catch (Exception e) {
            log.error("Error extrayendo userId del token", e);
            throw new RuntimeException("Invalid token");
        }
    }

    @Override
    public boolean isValidToken(String token) {
        log.warn("AuthServiceImpl.isValidToken() — STUB not implemented");

        try {
            String jwtToken = token.replace("Bearer ", "");
            // TODO: Validar JWT con tu library
            return !jwtToken.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String extractEmailFromToken(String token) {
        log.warn("AuthServiceImpl.extractEmailFromToken() — STUB not implemented");

        // TODO: Extraer email del JWT claim
        return "user@example.com";
    }

    @Override
    public String[] extractRolesFromToken(String token) {
        log.warn("AuthServiceImpl.extractRolesFromToken() — STUB not implemented");

        // TODO: Extraer roles del JWT claim
        return new String[]{"ROLE_EDITOR"};
    }
}
