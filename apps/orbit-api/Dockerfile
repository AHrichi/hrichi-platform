# Orbit API on the JVM, with a Java 25 AOT cache (ADR-0013).
# Build context: apps/orbit-api. Render builds this image itself.

FROM gradle:9.8.2-jdk25 AS build
WORKDIR /project
COPY gradle gradle
COPY gradlew settings.gradle.kts build.gradle.kts ./
# Dependencies in their own layer, so code changes don't download them again.
RUN ./gradlew --no-daemon -q dependencies --configuration runtimeClasspath > /dev/null
COPY src src
RUN ./gradlew --no-daemon -q bootJar \
 && java -Djarmode=tools -jar build/libs/orbit-api.jar extract --destination /extracted

FROM eclipse-temurin:25-jre-noble
WORKDIR /app
COPY --from=build /extracted/ ./
# Training run: start the context once and record the loaded classes, so
# the real start skips most class loading and linking on Render's 0.1 CPU.
# It exits after refresh, before the catalog loads or anything connects.
RUN java -XX:AOTCacheOutput=orbit-api.aot -Dspring.context.exit=onRefresh \
      -Dorbit.load-on-startup=false -jar orbit-api.jar \
 && useradd --system --uid 10001 orbit
USER orbit
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
EXPOSE 8080
ENTRYPOINT ["java", "-XX:AOTCache=orbit-api.aot", "-jar", "orbit-api.jar"]
