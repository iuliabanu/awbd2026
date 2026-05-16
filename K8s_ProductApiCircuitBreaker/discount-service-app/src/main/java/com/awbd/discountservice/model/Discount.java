package com.awbd.discountservice.model;

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
    // Null -- discount does not expire.
    private LocalDate expiryDate;

    public static Discount none(Long productId) {
        return new Discount(productId, 0.0, "No discount available", null);
    }
}
