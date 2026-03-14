package com.awbd.lab2.domain;

public enum Currency {
    USD("USD $"), EUR("EUR"), GBP("GBP");

    private final String description;

    public String getDescription() {
        return description;
    }

    Currency(String description) {
        this.description = description;
    }
}
