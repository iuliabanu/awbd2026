package com.awbd.lab6.config;

import com.awbd.lab6.domain.security.Authority;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("h2")
public class SecurityH2Config {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {


        UserDetails admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin"))
                .authorities("ROLE_ADMIN")
                .build();

        UserDetails guest = User.builder()
                .username("guest")
                .password(passwordEncoder.encode("guest"))
                .authorities("ROLE_GUEST")
                .build();

        return new InMemoryUserDetailsManager(admin, guest);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/products/form").hasRole("ADMIN")
                        .requestMatchers("/webjars/**", "/login", "/resources/**").permitAll()
                        .requestMatchers("/products/edit/**").hasRole("ADMIN")
                        .requestMatchers("/products/delete/**").hasRole("ADMIN")
                        .requestMatchers("/products/getimage/**").hasAnyRole("ADMIN", "GUEST")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/products").hasRole("ADMIN")
                        .requestMatchers("/products", "/products/").hasAnyRole("ADMIN", "GUEST")
                        .requestMatchers("/").hasAnyRole("ADMIN", "GUEST")
                        .requestMatchers("/categories/**").hasAnyRole("ADMIN", "GUEST")
                        .anyRequest().authenticated()
                )
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**")
                )
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())
                )
                .formLogin(formLogin ->
                        formLogin
                                .loginPage("/login")
                                .permitAll()
                                .loginProcessingUrl("/perform_login")
                )
                .exceptionHandling(
                        ex -> ex.accessDeniedPage("/access_denied"))
                .httpBasic(Customizer.withDefaults())
                .build();
    }
}

