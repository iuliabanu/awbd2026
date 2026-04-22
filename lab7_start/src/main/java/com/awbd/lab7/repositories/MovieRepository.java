package com.awbd.lab7.repositories;

import com.awbd.lab7.domain.Movie;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

// Step 7: replace MongoRepository with ReactiveMongoRepository
// and change all return types to Flux<Movie> / Mono<Movie>
public interface MovieRepository extends MongoRepository<Movie, String> {

    List<Movie> findByTitle(String title);

    List<Movie> findByYearBetween(int start, int end);

    @Query("{ 'year' : { $gt: ?0, $lt: ?1 } }")
    List<Movie> findByYearBetweenQ(int start, int end);

    @Query("{ 'title' : { $regex: ?0 } }")
    List<Movie> findByTitleRegexp(String regexp);

    List<Movie> findByTitleIsNotNull(Pageable pageable);
}
