package com.awbd.lab1c;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.*;

import javax.annotation.PostConstruct;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

class Invoice{
    String details;

    public Invoice(String details){
        this.details = details;
    }

    @Override
    public String toString() {
        return "Invoice{" +
                "details='" + details + '\'' +
                '}';
    }
}

class FeaturesImpl implements Features, InitializingBean {
    private List<String> features;

    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("Bean Features afterPropertiesSet() invoked... ");
    }

    @PostConstruct
    public void customInit() {
        System.out.println("Bean Features customInit() invoked...");
    }

    public FeaturesImpl() {
        features = new ArrayList<>();
    }

    public void addFeature(String feature) {
        features.add(feature);
    }

    @Override
    public String toString() {
        return "FeaturesImpl{" +
                "features=" + features +
                '}';
    }
}


class ExternalCalculator implements DiscountCalculator{
    public double calculate(int price) {
        return 0.65 * price;
    }
}

@Configuration
@ComponentScan("com.awbd.lab1c")
@PropertySource("classpath:application.properties")
public class SubscriptionConfig {

    @Bean
    public DiscountCalculator externalCalculator(){
        return new ExternalCalculator();
    }

    @Bean
    @Scope("prototype")
    public Features featureBean() {
        return new FeaturesImpl();
    }

    @Bean
    @Scope("prototype")
    public Invoice invoice() {
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return new Invoice(String.valueOf(LocalTime.now()));}


}