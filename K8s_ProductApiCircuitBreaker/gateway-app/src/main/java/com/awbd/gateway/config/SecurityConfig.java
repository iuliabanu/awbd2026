package com.awbd.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;


@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                // stateless API gateway.
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                .authorizeExchange(auth -> auth
                        // Actuator health endpoint — must be reachable without a token
                        .pathMatchers("/actuator/health/**").permitAll()
                        // All other requests (including /api/**) require a valid JWT.
                        .anyExchange().authenticated()
                )

                // Configure JWT resource server.
                // Spring Boot auto-configures the ReactiveJwtDecoder from
                // spring.security.oauth2.resourceserver.jwt.issuer-uri.
                // It fetches {issuer-uri}/.well-known/openid-configuration to
                // discover the JWKS URI and downloads the public keys.
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(Customizer.withDefaults())
                )
                .build();
    }
}