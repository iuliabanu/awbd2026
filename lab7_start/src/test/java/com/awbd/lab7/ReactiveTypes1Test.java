package com.awbd.lab7;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;

public class ReactiveTypes1Test {

    // Step 2: Create a Flux of integers 1,2,3,4 using Flux.just().
    // Subscribe with elements::add and assert the list contains exactly 1,2,3,4.
    @Test
    public void subscriber() {
        List<Integer> elements = new ArrayList<>();
        // TODO: implement
    }

    // Step 3: Create a Flux of integers 1,2,3,4.
    // Implement a CoreSubscriber that requests only 2 elements at a time (backpressure).
    // Assert the list contains exactly 1,2,3,4.
    @Test
    public void backPressure() {
        List<Integer> elements = new ArrayList<>();
        // TODO: implement
    }

    // Step 4: Create a Flux of integers 1,2,3,4.
    // Map each element to its double using .map(i -> i * 2).
    // Assert the list contains exactly 2,4,6,8.
    @Test
    public void fluxMap() {
        List<Integer> elements = new ArrayList<>();
        // TODO: implement
    }
}
