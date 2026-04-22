package com.awbd.lab7.exceptions;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String resourceName, String id) {
        super(resourceName + " not found with id: " + id);
    }
}
