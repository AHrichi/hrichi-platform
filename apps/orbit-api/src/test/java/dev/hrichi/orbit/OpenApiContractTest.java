package dev.hrichi.orbit;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Writes the OpenAPI document to apps/orbit-api/openapi.json, where it is
 * committed. The TypeScript client is generated from that file, and CI fails
 * when either differs from what's committed: the contract can't change by
 * accident (ADR-0013).
 */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiContractTest {

    @Autowired
    MockMvcTester mvc;

    @Test
    void writesTheContract() throws IOException {
        String body = mvc.get().uri("/v3/api-docs").exchange().getResponse().getContentAsString();
        JsonMapper json = JsonMapper.builder().enable(SerializationFeature.INDENT_OUTPUT).build();
        JsonNode document = json.readTree(body);

        assertThat(document.path("paths").has("/nights")).isTrue();
        // The server URL depends on how the test runs; it isn't part of the contract.
        ((tools.jackson.databind.node.ObjectNode) document).remove("servers");
        Files.writeString(
                Path.of("openapi.json"), json.writeValueAsString(document) + "\n", StandardCharsets.UTF_8);
    }
}
