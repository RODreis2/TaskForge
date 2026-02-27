package com.Exemple.Event.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.io.IOException;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;

@Configuration
public class JwtDecoderConfig {

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${TaskForge.security.public-key}") String publicKeyLocation,
            ResourceLoader resourceLoader
    ) {
        Resource publicKeyResource = resolvePublicKeyResource(publicKeyLocation, resourceLoader);
        RSAPublicKey publicKey = readPublicKey(publicKeyResource);
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
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

    static RSAPublicKey readPublicKey(Resource resource) {
        String pem = readPem(resource);
        String normalizedBase64 = normalizePemToBase64(pem);
        return decodeRsaPublicKey(normalizedBase64);
    }

    static String readPem(Resource resource) {
        try {
            return new String(resource.getInputStream().readAllBytes());
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
                    "TaskForge.security.public-key resolved to empty content; expected RSA public key in PEM/Base64"
            );
        }

        int remainder = key.length() % 4;
        if (remainder != 0) {
            key = key + "=".repeat(4 - remainder);
        }

        return key;
    }

    static RSAPublicKey decodeRsaPublicKey(String normalizedBase64) {
        try {
            byte[] decoded = Base64.getDecoder().decode(normalizedBase64);
            var keyFactory = java.security.KeyFactory.getInstance("RSA");
            var keySpec = new java.security.spec.X509EncodedKeySpec(decoded);
            var publicKey = keyFactory.generatePublic(keySpec);
            if (!(publicKey instanceof RSAPublicKey rsaPublicKey)) {
                throw new IllegalStateException(
                        "TaskForge.security.public-key must be an RSA public key (X.509/SPKI)"
                );
            }
            return rsaPublicKey;
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "TaskForge.security.public-key does not contain valid Base64/PEM content",
                    e
            );
        } catch (Exception e) {
            throw new IllegalStateException(
                    "TaskForge.security.public-key is not a valid RSA public key (X.509/SPKI)",
                    e
            );
        }
    }
}
