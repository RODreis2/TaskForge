package com.Event.User.config;

import com.Event.User.domain.UserModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import java.time.Instant;
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;


@Component
public class TokenService {

    @Value("${TaskForge.security.private-key}")
    private Resource privateKeyResource;

    @Value("${TaskForge.security.public-key}")
    private Resource publicKeyResource;

    private RSAPrivateKey privateKey;
    private RSAPublicKey publicKey;

    @PostConstruct
    public void init() throws Exception {
        privateKey = loadPrivateKey(privateKeyResource);
        publicKey = loadPublicKey(publicKeyResource);
    }

    public String generateToken(UserModel user) {

        Algorithm algorithm = Algorithm.RSA256(publicKey, privateKey);

        return JWT.create()
                .withSubject(user.getEmail())
                .withClaim("userId", user.getId().toString())
                .withClaim("name", user.getName())
                .withIssuer("Api TaskForge")
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plusSeconds(86400))
                .sign(algorithm);
    }

    public Optional<JWTuserData> verifyToken(String token) {
        try {

            Algorithm algorithm = Algorithm.RSA256(publicKey, null);

            DecodedJWT jwt = JWT.require(algorithm)
                    .withIssuer("Api TaskForge")
                    .build()
                    .verify(token);

            return Optional.of(
                    new JWTuserData(
                            UUID.fromString(jwt.getClaim("userId").asString()),
                            jwt.getClaim("name").asString(),
                            jwt.getSubject()
                    )
            );

        } catch (JWTVerificationException ex) {
            return Optional.empty();
        }
    }

    // 🔧 Métodos auxiliares para ler PEM

    private RSAPrivateKey loadPrivateKey(Resource resource) throws Exception {
        String key = new String(resource.getInputStream().readAllBytes())
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);

        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);

        KeyFactory kf = KeyFactory.getInstance("RSA");

        return (RSAPrivateKey) kf.generatePrivate(keySpec);
    }

    private RSAPublicKey loadPublicKey(Resource resource) throws Exception {
        String key = new String(resource.getInputStream().readAllBytes())
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);

        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);

        KeyFactory kf = KeyFactory.getInstance("RSA");

        return (RSAPublicKey) kf.generatePublic(keySpec);
    }
}