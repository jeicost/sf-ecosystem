package com.discoolver.guides.security;

/**
 * Interfaz para servicios de autenticación
 * Implementa según tu JWT library (auth0, jjwt, etc)
 */
public interface AuthService {

    /**
     * Extraer userId del token JWT
     * @param token Header "Authorization: Bearer {token}"
     * @return userId del usuario autenticado
     * @throws UnauthorizedException si token es inválido o expirado
     */
    Long extractUserIdFromToken(String token);

    /**
     * Validar que el token es válido
     * @param token JWT token
     * @return true si es válido
     */
    boolean isValidToken(String token);

    /**
     * Extraer email del token
     * @param token JWT token
     * @return email del usuario
     */
    String extractEmailFromToken(String token);

    /**
     * Extraer roles del token
     * @param token JWT token
     * @return array de roles (ROLE_ADMIN, ROLE_EDITOR, etc)
     */
    String[] extractRolesFromToken(String token);
}
