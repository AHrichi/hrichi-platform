package dev.hrichi.orbit.web;

import static org.assertj.core.api.Assertions.assertThat;

import dev.hrichi.orbit.TestData;
import dev.hrichi.orbit.catalog.Catalog;
import dev.hrichi.orbit.catalog.CatalogInfo;
import dev.hrichi.orbit.config.OrbitConfig;
import dev.hrichi.orbit.passes.PassPredictor;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.zip.GZIPInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@WebMvcTest(
        controllers = SatelliteController.class,
        properties = "orbit.cors-origins=https://portfolio.example")
@Import({Catalog.class, PassPredictor.class, OrbitConfig.class})
class SatelliteControllerTest {

    @Autowired
    MockMvcTester mvc;

    @Autowired
    Catalog catalog;

    @BeforeEach
    void fillCatalog() {
        catalog.replace(
                List.of(TestData.ISS, TestData.GPS, TestData.GEO),
                new CatalogInfo(CatalogInfo.CELESTRAK, Instant.parse("2026-10-27T06:00:00Z"), null, "ok", 3));
    }

    @Test
    void servesTheCatalogPreGzippedWithAnEtag() throws IOException {
        MvcTestResult result = mvc.get().uri("/satellites").header(HttpHeaders.ACCEPT_ENCODING, "gzip").exchange();

        assertThat(result).hasStatusOk().hasHeader(HttpHeaders.CONTENT_ENCODING, "gzip");
        String json = gunzip(result.getResponse().getContentAsByteArray());
        assertThat(json).contains("\"count\":3").contains("\"OBJECT_NAME\":\"ISS (ZARYA)\"");

        String etag = result.getResponse().getHeader(HttpHeaders.ETAG);
        assertThat(mvc.get().uri("/satellites").header(HttpHeaders.IF_NONE_MATCH, etag))
                .hasStatus(HttpStatus.NOT_MODIFIED);
    }

    @Test
    void filtersByGroup() {
        assertThat(mvc.get().uri("/satellites?group=stations"))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.satellites[*].NORAD_CAT_ID")
                .asArray()
                .containsExactly(25544);
    }

    @Test
    void rejectsAnUnknownGroupAsAProblem() {
        assertThat(mvc.get().uri("/satellites?group=ufo"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.errors[0].parameter")
                .isEqualTo("group");
    }

    @Test
    void describesOneSatellite() {
        assertThat(mvc.get().uri("/satellites/25544"))
                .hasStatusOk()
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.group").isEqualTo("STATIONS");
                    assertThat(json).extractingPath("$.orbitClass").isEqualTo("LEO");
                    assertThat(json).extractingPath("$.periodMinutes").isEqualTo(93.0);
                });
    }

    @Test
    void answersAnUnknownSatelliteWith404() {
        assertThat(mvc.get().uri("/satellites/1"))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.noradId")
                .isEqualTo(1);
    }

    @Test
    void listsEveryInvalidPassParameter() {
        assertThat(mvc.get().uri("/satellites/25544/passes?lat=100&lon=10&days=30"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors[*].parameter")
                .asArray()
                .containsExactlyInAnyOrder("lat", "days");
    }

    @Test
    void predictsPasses() {
        assertThat(mvc.get().uri("/satellites/25544/passes?lat=36.8&lon=10.18&days=1"))
                .hasStatusOk()
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.name").isEqualTo("ISS (ZARYA)");
                    assertThat(json).extractingPath("$.minElevationDeg").isEqualTo(10.0);
                });
    }

    @Test
    void allowsOnlyTheConfiguredOrigins() {
        assertThat(mvc.options()
                        .uri("/satellites")
                        .header(HttpHeaders.ORIGIN, "https://portfolio.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .hasStatusOk()
                .hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://portfolio.example");

        assertThat(mvc.options()
                        .uri("/satellites")
                        .header(HttpHeaders.ORIGIN, "https://elsewhere.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .hasStatus(HttpStatus.FORBIDDEN);
    }

    private static String gunzip(byte[] body) throws IOException {
        try (var in = new GZIPInputStream(new ByteArrayInputStream(body))) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
