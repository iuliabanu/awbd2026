package com.awbd.discountservice.service;

import com.awbd.discountservice.model.Discount;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class DiscountService {

    private static final Map<Long, Discount> DISCOUNTS = Map.of(
            1L, new Discount(1L, 10.0, "Summer Sale",        LocalDate.now().plusMonths(2)),
            2L, new Discount(2L, 15.0, "Clearance",          LocalDate.now().plusWeeks(1)),
            3L, new Discount(3L,  5.0, "Loyalty Discount",   null)
    );

    public Discount getDiscount(Long productId) {
        return DISCOUNTS.getOrDefault(productId, Discount.none(productId));
    }

    /** Returns only discounts that have a real percentage (> 0). */
    public List<Discount> getAllDiscounts() {
        return DISCOUNTS.values().stream()
                .filter(d -> d.getPercentage() > 0)
                .toList();
    }
}
