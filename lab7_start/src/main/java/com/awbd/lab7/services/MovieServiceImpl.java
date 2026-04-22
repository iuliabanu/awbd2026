package com.awbd.lab7.services;

import com.awbd.lab7.domain.Movie;
import com.awbd.lab7.exceptions.NotFoundException;
import com.awbd.lab7.repositories.MovieRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

// Step 8: convert all methods to return Flux<Movie> / Mono<Movie> / Mono<Void> / Mono<Page<Movie>>
// Use collectList(), zipWith(count()), and map() to build the paginated result reactively.
@Service
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepository;

    public MovieServiceImpl(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @Override
    public Movie findById(String id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Movie", id));
    }

    @Override
    public void deleteById(String id) {
        movieRepository.deleteById(id);
    }

    @Override
    public List<Movie> findAll() {
        return movieRepository.findAll();
    }

    @Override
    public Page<Movie> findPaginated(Pageable pageable) {
        List<Movie> movies = movieRepository.findByTitleIsNotNull(pageable);
        long total = movieRepository.count();
        return new PageImpl<>(movies, pageable, total);
    }
}
