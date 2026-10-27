import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
    java
    id("org.springframework.boot") version "4.1.2"
    // Applied only with -Pnative (the native-image build): with it, Spring Boot
    // also runs AOT processing for every test run. See ADR-0013.
    id("org.graalvm.buildtools.native") version "1.1.14" apply false
}

if (providers.gradleProperty("native").isPresent) {
    apply(plugin = "org.graalvm.buildtools.native")
}

group = "dev.hrichi"
version = "0.1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform(SpringBootPlugin.BOM_COORDINATES))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-api:3.2.0")
    implementation("org.orekit:orekit:13.1.9")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}

tasks.test {
    useJUnitPlatform()
    // Integration tests run when a MongoDB is available (CI's service, or Docker locally).
    environment("MONGODB_TEST_URI", System.getenv("MONGODB_TEST_URI") ?: "")
    testLogging {
        events("failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}

tasks.bootJar {
    archiveFileName = "orbit-api.jar"
}
