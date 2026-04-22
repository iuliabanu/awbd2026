package com.awbd.lab7.services;

import com.awbd.lab7.domain.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

// Step 8: change all return types to Flux<Movie> / Mono<Movie> / Mono<Void> / Mono<Page<Movie>>
public interface MovieService {

    List<Movie> findAll();

    Movie findById(String id);

    void deleteById(String id);

    Page<Movie> findPaginated(Pageable pageable);
}
