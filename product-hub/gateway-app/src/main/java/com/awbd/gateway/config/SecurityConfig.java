package com.awbd.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                // Delegate CORS to the CorsWebFilter built by Spring Cloud Gateway
                // from spring.cloud.gateway.globalcors in application.yaml.
                // This ensures the single source of truth is the yaml (supports
                // ${FRONTEND_ORIGIN} env-var override for Docker / K8s).
                .cors(Customizer.withDefaults())

                .authorizeExchange(auth -> auth
                        .pathMatchers("/actuator/health/**").permitAll()
                        // Browser pre-flight OPTIONS must pass without a JWT
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(Customizer.withDefaults())
                )
                .build();
    }
}

