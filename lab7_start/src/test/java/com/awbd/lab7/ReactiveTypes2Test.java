package com.awbd.lab7;

import com.awbd.lab7.domain.Movie;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

@Slf4j
public class ReactiveTypes2Test {

    // Step 5: Wrap a Movie in a Mono using Mono.just().
    // Filter with a title that does NOT match — verify the result is null (NPE on access).
    // Filter with a title that DOES match — log the result.
    @Test
    public void monoFilter() throws Exception {
        Movie movie = new Movie();
        movie.setTitle("test movie");
        // TODO: implement
    }

    // Step 6: Create a Flux<String> of "one","two","three".
    // Use delayElements(Duration.ofSeconds(5)) and a CountDownLatch to wait for completion.
    @Test
    public void fluxDelay() throws Exception {
        // TODO: implement
    }
}
