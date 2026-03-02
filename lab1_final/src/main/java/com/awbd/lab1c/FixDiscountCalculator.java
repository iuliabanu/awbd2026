package com.awbd.lab1c;

import com.awbd.lab1c.DiscountCalculator;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class FixDiscountCalculator implements DiscountCalculator {

    public double calculate(int price) {
        return 0.85 * price;
    }
}