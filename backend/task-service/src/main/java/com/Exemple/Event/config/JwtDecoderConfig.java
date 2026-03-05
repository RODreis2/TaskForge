package com.Exemple.Event.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.interfaces.EdECPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class JwtDecoderConfig {

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${TaskForge.security.public-key}") String publicKeyLocation,
            ResourceLoader resourceLoader
    ) {
        Resource publicKeyResource = resolvePublicKeyResource(publicKeyLocation, resourceLoader);
        EdECPublicKey publicKey = readPublicKey(publicKeyResource);

        return token -> {
            try {
                var jws = Jwts.parser()
                        .verifyWith(publicKey)
                        .build()
                        .parseSignedClaims(token);

                Claims claims = jws.getPayload();
                Instant issuedAt = claims.getIssuedAt() == null ? Instant.now() : claims.getIssuedAt().toInstant();
                Instant expiresAt = claims.getExpiration() == null ? issuedAt.plusSeconds(86400) : claims.getExpiration().toInstant();
                Map<String, Object> headers = new HashMap<>(jws.getHeader());
                Map<String, Object> claimMap = new HashMap<>(claims);

                return new Jwt(token, issuedAt, expiresAt, headers, claimMap);
            } catch (JwtException | IllegalArgumentException ex) {
                throw new BadJwtException("Invalid EdDSA JWT", ex);
            }
        };
    }

    static Resource resolvePublicKeyResource(String location, ResourceLoader resourceLoader) {
        String normalizedLocation = normalizeResourceLocation(location, System.getProperty("user.home"));
        return resourceLoader.getResource(normalizedLocation);
    }

    static String normalizeResourceLocation(String location, String userHome) {
        if (location == null || location.isBlank()) {
            throw new IllegalStateException(
                    "TaskForge.security.public-key must be configured with a valid resource location"
            );
        }

        String trimmedLocation = location.trim();

        if (trimmedLocation.startsWith("file:~/")) {
            return "file:" + userHome + trimmedLocation.substring("file:~".length());
        }

        if (trimmedLocation.startsWith("~/")) {
            return "file:" + userHome + trimmedLocation.substring(1);
        }

        return trimmedLocation;
    }

    static EdECPublicKey readPublicKey(Resource resource) {
        String pem = readPem(resource);
        String normalizedBase64 = normalizePemToBase64(pem);
        return decodeEdDsaPublicKey(normalizedBase64);
    }

    static String readPem(Resource resource) {
        try {
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            String description = resource.getDescription();
            throw new IllegalStateException(
                    "Could not read TaskForge.security.public-key resource: " + description,
                    e
            );
        }
    }

    static String normalizePemToBase64(String pemText) {
        String key = pemText
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "")
                .replace("\"", "")
                .replace("'", "");

        if (key.isBlank()) {
            throw new IllegalStateException(
                    "TaskForge.security.public-key resolved to empty content; expected Ed25519 public key in PEM/Base64"
            );
        }

        int remainder = key.length() % 4;
        if (remainder != 0) {
            key = key + "=".repeat(4 - remainder);
        }

        return key;
    }

    static EdECPublicKey decodeEdDsaPublicKey(String normalizedBase64) {
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(normalizedBase64);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "TaskForge.security.public-key does not contain valid Base64/PEM content",
                    e
            );
        }

        try {
            PublicKey publicKey = KeyFactory.getInstance("Ed25519").generatePublic(new X509EncodedKeySpec(decoded));
            if (!(publicKey instanceof EdECPublicKey edECPublicKey)) {
                throw new IllegalStateException(
                        "TaskForge.security.public-key must be an Ed25519 public key (X.509/SPKI)"
                );
            }
            return edECPublicKey;
        } catch (InvalidKeySpecException e) {
            if (isRsaPublicKey(decoded)) {
                throw new IllegalStateException(
                        "TaskForge.security.public-key is RSA, but task-service requires an Ed25519 public key (X.509/SPKI). " +
                                "Use the same Ed25519 keypair as user-service.",
                        e
                );
            }
            throw new IllegalStateException(
                    "TaskForge.security.public-key is not a valid Ed25519 public key (X.509/SPKI)",
                    e
            );
        } catch (Exception e) {
            throw new IllegalStateException(
                    "TaskForge.security.public-key is not a valid Ed25519 public key (X.509/SPKI)",
                    e
            );
        }
    }

    static boolean isRsaPublicKey(byte[] encoded) {
        try {
            KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(encoded));
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }
}
