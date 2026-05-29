package com.awbd.productservice.client;

import com.awbd.productservice.model.Discount;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class DiscountClient {

    private static final Logger log = LoggerFactory.getLogger(DiscountClient.class);
    private static final String CB_NAME = "discount-service";

    private final RestClient restClient;

    public DiscountClient(@Value("${discount.service.uri}") String discountServiceUri) {
        this.restClient = RestClient.builder()
                .baseUrl(discountServiceUri)
                .build();
    }

    @CircuitBreaker(name = CB_NAME, fallbackMethod = "getDiscountFallback")
    public Discount getDiscount(Long productId) {
        log.info("Calling discount-service for product ID: {}", productId);
        return restClient.get()
                .uri("/api/discounts/{productId}", productId)
                .retrieve()
                .body(Discount.class);
    }


    private Discount getDiscountFallback(Long productId, Throwable cause) {
        log.warn("Circuit breaker fallback for product ID: {} — cause: {}",
                productId, cause.getMessage());
        return Discount.unavailable(productId);
    }
}

