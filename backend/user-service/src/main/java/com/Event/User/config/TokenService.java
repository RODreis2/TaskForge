package com.Event.User.config;

import com.Event.User.domain.UserModel;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Component
public class TokenService {

    @Value("${TaskForge.security.private-key}")
    private String privateKeyLocation;

    @Value("${TaskForge.security.public-key}")
    private String publicKeyLocation;

    private final ResourceLoader resourceLoader;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    public TokenService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void init() throws Exception {
        privateKey = loadPrivateKey(resolveResource(privateKeyLocation));
        publicKey = loadPublicKey(resolveResource(publicKeyLocation));
    }

    public String generateToken(UserModel user) {
        Instant issuedAt = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId().toString())
                .claim("name", user.getName())
                .issuer("Api TaskForge")
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(issuedAt.plusSeconds(86400)))
                .signWith(privateKey, Jwts.SIG.EdDSA)
                .compact();
    }

    public Optional<JWTuserData> verifyToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .requireIssuer("Api TaskForge")
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.get("userId", String.class);
            String name = claims.get("name", String.class);
            String email = claims.getSubject();
            if (userId == null || userId.isBlank() || email == null || email.isBlank()) {
                return Optional.empty();
            }

            return Optional.of(new JWTuserData(UUID.fromString(userId), name, email));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private Resource resolveResource(String location) {
        String userHome = System.getProperty("user.home");
        String trimmed = location == null ? "" : location.trim();

        if (trimmed.startsWith("file:~/")) {
            return resourceLoader.getResource("file:" + userHome + trimmed.substring("file:~".length()));
        }

        if (trimmed.startsWith("~/")) {
            return resourceLoader.getResource("file:" + userHome + trimmed.substring(1));
        }

        return resourceLoader.getResource(trimmed);
    }

    private PrivateKey loadPrivateKey(Resource resource) throws Exception {
        String key = normalizeBase64(readResource(resource)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", ""));
        byte[] decoded = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
        return KeyFactory.getInstance("Ed25519").generatePrivate(keySpec);
    }

    private PublicKey loadPublicKey(Resource resource) throws Exception {
        String key = normalizeBase64(readResource(resource)
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", ""));
        byte[] decoded = Base64.getDecoder().decode(key);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
        return KeyFactory.getInstance("Ed25519").generatePublic(keySpec);
    }

    private String readResource(Resource resource) throws Exception {
        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

    private String normalizeBase64(String value) {
        String normalized = value
                .replace("\"", "")
                .replace("'", "")
                .replaceAll("\\s", "");

        int remainder = normalized.length() % 4;
        if (remainder != 0) {
            normalized = normalized + "=".repeat(4 - remainder);
        }
        return normalized;
    }
}
