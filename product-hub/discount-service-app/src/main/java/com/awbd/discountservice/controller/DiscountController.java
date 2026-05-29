package com.awbd.discountservice.controller;

import com.awbd.discountservice.model.Discount;
import com.awbd.discountservice.service.DiscountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    /** Returns all active discounts — used by promoUI/PromoBanner. */
    @GetMapping
    public ResponseEntity<List<Discount>> getAllDiscounts() {
        return ResponseEntity.ok(discountService.getAllDiscounts());
    }

    @GetMapping("/{productId}")
    public ResponseEntity<Discount> getDiscount(@PathVariable Long productId) {
        return ResponseEntity.ok(discountService.getDiscount(productId));
    }
}
