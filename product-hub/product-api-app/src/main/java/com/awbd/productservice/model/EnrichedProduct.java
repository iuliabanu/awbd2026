package com.awbd.productservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrichedProduct {

    private Product product;
    private Discount discount;

    // Pre-computed discounted price — null if discount is unavailable.
    private BigDecimal discountedPrice;

    public static EnrichedProduct of(Product product, Discount discount) {
        BigDecimal discountedPrice = null;

        if (discount != null && discount.getPercentage() != null && discount.getPercentage() > 0) {
            BigDecimal factor = BigDecimal.ONE
                    .subtract(BigDecimal.valueOf(discount.getPercentage() / 100.0));
            discountedPrice = product.getPrice()
                    .multiply(factor)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return new EnrichedProduct(product, discount, discountedPrice);
    }
}

