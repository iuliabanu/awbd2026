package com.awbd.lab1c;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class DiscountLoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(DiscountLoggingAspect.class);

    @Before("execution(* com.awbd.lab1c.DiscountCalculator.calculate(..)) && args(price)")
    public void logBeforeDiscount(JoinPoint joinPoint, double price) {
        logger.info("Discount applied for price: {}", price);
    }
}
