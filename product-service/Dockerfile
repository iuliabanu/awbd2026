# Multi-stage build for Spring Boot application

# Stage 1: Build the application
FROM gradle:ubi AS build

WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Download dependencies
RUN gradle dependencies --no-daemon

# Copy source code
COPY src ./src

# Build the application
RUN gradle bootJar --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Set environment variables with default values
ENV MYSQL_HOST=product-mysql \
    MYSQL_PORT=3306 \
    MYSQL_DATABASE=productdb \
    MYSQL_USER=root \
    MYSQL_PASSWORD=password \
    REDIS_HOST=product-redis \
    REDIS_PORT=5000

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
