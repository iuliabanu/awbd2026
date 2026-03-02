package com.awbd.lab1c;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component("myMoviesSubscription")
public class MoviesSubscription implements Subscription {
    DiscountCalculator discountCalculator;

    Features features;

    @Autowired
    public void setFeatures(Features features){
        this.features = features;
    }

    @Autowired
    public void setDiscountCalculator(@Qualifier("externalCalculator") DiscountCalculator discountCalculator) {
        this.discountCalculator = discountCalculator;
    }

    public void addFeature(String option){
        features.addFeature(option);
    }

    public double getPrice() {
        return discountCalculator.calculate(100);
    }

    public String getDescription() {
        return "movies subscription -- monthly payment plan";
    }
}


