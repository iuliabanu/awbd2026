FROM gradle:ubi AS build

WORKDIR /app

COPY build.gradle settings.gradle ./
COPY gradle ./gradle

RUN gradle dependencies --no-daemon
COPY src ./src

RUN gradle bootJar --no-daemon

FROM eclipse-temurin:25-jre-alpine

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENV MYSQL_HOST=product-mysql \
    MYSQL_PORT=3306 \
    MYSQL_DATABASE=productdb \
    MYSQL_USER=root \
    MYSQL_PASSWORD=password \
    REDIS_HOST=product-redis \
    REDIS_PORT=5000

ENTRYPOINT ["java", "-jar", "app.jar"]
