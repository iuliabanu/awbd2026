package com.awbd.productservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Discount {

    private Long productId;
    private Double percentage;
    private String description;
    private LocalDate expiryDate;

    /** Fallback value used when the circuit is open or discount-service is down. */
    public static Discount unavailable(Long productId) {
        return new Discount(productId, null, "Discount service unavailable", null);
    }
}

