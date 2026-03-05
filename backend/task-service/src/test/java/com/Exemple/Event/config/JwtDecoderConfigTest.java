package com.Exemple.Event.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.support.TestPropertySourceUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.EdECPublicKey;
import java.util.Base64;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtDecoderConfigTest {

    @Test
    void decodeEdDsaPublicKeyThrowsClearMessageForInvalidBase64() {
        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> JwtDecoderConfig.decodeEdDsaPublicKey("file:/tmp/public_key.pem")
        );

        assertTrue(ex.getMessage().contains("TaskForge.security.public-key"));
        assertTrue(ex.getMessage().contains("Base64/PEM"));
    }

    @Test
    void readPublicKeyLoadsFromResource() throws Exception {
        EdECPublicKey original = generatedPublicKey();
        String pem = toPem(original);

        EdECPublicKey parsed = JwtDecoderConfig.readPublicKey(new ByteArrayResource(pem.getBytes()));
        assertTrue(Arrays.equals(original.getEncoded(), parsed.getEncoded()));
    }

    @Test
    void jwtDecoderBeanIsCreatedFromFileProperty(@TempDir Path tempDir) throws Exception {
        EdECPublicKey key = generatedPublicKey();
        Path pemFile = tempDir.resolve("public_key.pem");
        Files.writeString(pemFile, toPem(key));

        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            TestPropertySourceUtils.addInlinedPropertiesToEnvironment(
                    context,
                    "TaskForge.security.public-key=file:" + pemFile.toAbsolutePath()
            );
            context.register(JwtDecoderConfig.class);
            context.refresh();

            JwtDecoder decoder = context.getBean(JwtDecoder.class);
            assertNotNull(decoder);
        }
    }

    @Test
    void decodeEdDsaPublicKeyThrowsClearMessageForRsaKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair rsaPair = generator.generateKeyPair();
        String rsaBase64 = Base64.getEncoder().encodeToString(rsaPair.getPublic().getEncoded());

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> JwtDecoderConfig.decodeEdDsaPublicKey(rsaBase64)
        );

        assertTrue(ex.getMessage().contains("is RSA"));
        assertTrue(ex.getMessage().contains("Ed25519"));
    }

    private static EdECPublicKey generatedPublicKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("Ed25519");
        KeyPair pair = generator.generateKeyPair();
        return (EdECPublicKey) pair.getPublic();
    }

    private static String toPem(EdECPublicKey key) {
        String base64 = Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(key.getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + base64 + "\n-----END PUBLIC KEY-----\n";
    }
}
