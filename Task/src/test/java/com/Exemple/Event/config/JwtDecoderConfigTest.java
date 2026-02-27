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
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtDecoderConfigTest {

    @Test
    void normalizePemToBase64RemovesHeadersQuotesAndWhitespace() throws Exception {
        RSAPublicKey key = generatedPublicKey();
        String base64 = Base64.getEncoder().encodeToString(key.getEncoded());
        String pemLike = "'-----BEGIN PUBLIC KEY-----\n" + base64 + "\n-----END PUBLIC KEY-----'";

        String normalized = JwtDecoderConfig.normalizePemToBase64(pemLike);

        assertEquals(base64, normalized);
    }

    @Test
    void decodeRsaPublicKeyThrowsClearMessageForInvalidBase64() {
        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> JwtDecoderConfig.decodeRsaPublicKey("file:/tmp/public_key.pem")
        );

        assertTrue(ex.getMessage().contains("TaskForge.security.public-key"));
        assertTrue(ex.getMessage().contains("Base64/PEM"));
    }

    @Test
    void readPublicKeyLoadsFromResource() throws Exception {
        RSAPublicKey original = generatedPublicKey();
        String pem = toPem(original);

        RSAPublicKey parsed = JwtDecoderConfig.readPublicKey(new ByteArrayResource(pem.getBytes()));

        assertEquals(original.getModulus(), parsed.getModulus());
        assertEquals(original.getPublicExponent(), parsed.getPublicExponent());
    }

    @Test
    void jwtDecoderBeanIsCreatedFromFileProperty(@TempDir Path tempDir) throws Exception {
        RSAPublicKey key = generatedPublicKey();
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

    private static RSAPublicKey generatedPublicKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair pair = generator.generateKeyPair();
        return (RSAPublicKey) pair.getPublic();
    }

    private static String toPem(RSAPublicKey key) {
        String base64 = Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(key.getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + base64 + "\n-----END PUBLIC KEY-----\n";
    }
}
