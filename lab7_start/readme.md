# Project - Spring WebFlux with MongoDB

- Spring Data for MongoDB (Reactive)
- Spring Reactive Stack (WebFlux + Project Reactor)

---

### Reactive Manifesto

- Architectural design pattern [1]. (Reactive Systems)
- Reactive programming: event-based, asynchronous, non-blocking programming technique.

![External Image](https://bafybeic3soo47hitwlxqdhnjkoka3sqvjs44dhoouhc3725hukhhrs7qwu.ipfs.w3s.link/reactive1.png)

#### Responsive
- Rapid response time.
- Usability and utility.
- Problems may be detected quickly; the system is self-healing.
- Encourages interaction and simplifies error handling.

#### Resilient
- High availability — replication, load balancing.
- Isolation — avoids single point of failure.
- Failures are contained within each component.
- Recovery is delegated to another component.

#### Elastic
- System stays responsive under varying workload.
- Increases or decreases resources allocated to service inputs.
- Example: Google Kubernetes.
- Automatic and dynamic scaling.

#### Message Driven
- Events are captured asynchronously.
- Loose coupling and isolation.
- Location transparency (scale vertically or horizontally).
- Non-blocking communication allows recipients to consume resources only while active, reducing system overhead.
- Functions are defined to handle an event or an error.

---

### Reactive Programming / Reactive Streams

- Streams of data.
- Highly concurrent message consumers.
- Spring implementation: Project Reactor [7].

![External Image](https://bafybeibndwbw4dpbbakrt2iqlimtcxqmhak4fk3q7f5pbsiyjhplrwit5a.ipfs.w3s.link/reactive2.png)
[11]

#### Asynchronous Stream Processing
Events are produced and consumed asynchronously.
For example, a `Flux` retrieves elements from a database and maps or filters them
according to some criteria — but only when a subscriber subscribes to the `Flux`.

**Interfaces**

**Publisher:** provides an unbounded number of elements, i.e. the data stream.

**Publisher implementations** [2]:
- **Mono** — publisher with 0 or 1 element in the data stream.
- **Flux** — publisher with 0 or many elements in the data stream.

**Subscriber:** consumes data from a publisher.
The consumer should be able to signal the producer about how much data to send (**backpressure**).

**Subscription:** links a publisher and a subscriber.

**Demand:** feedback from the subscriber to the publisher (backpressure).

![External Image](https://bafybeidxt5qt3qdwwfoeojq3omsx5nbwvne65osz54xnpbqjs4pouncsxa.ipfs.w3s.link/reactive3.png)

---

### Project Setup

Run Docker Compose (in the `mongo-init` directory) to initialize a MongoDB container:

```
docker compose up
```

---

### Step 1 — Gradle Configuration

Add the Gradle dependencies needed to test Spring Reactive Types in `build.gradle`:

```groovy
implementation 'io.projectreactor:reactor-core'

testImplementation 'io.projectreactor:reactor-test'
testImplementation 'ch.qos.logback:logback-classic'
```

---

### Step 2
Create a test class to test the `Flux` interface.
Use method `just` to create a stream of elements.
Use method `subscribe` to indicate the method to be called on each element in the stream.

```java
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
// ...

public class ReactiveTypes1Test {

    @Test
    public void subscriber() {
        List<Integer> elements = new ArrayList<>();

        Flux.just(1, 2, 3, 4).log()
                .subscribe(elements::add);

        assertThat(elements).containsExactly(1, 2, 3, 4);
    }
}
```

---

### Step 3
Implement a Subscriber that requests from the publisher groups of only two elements at a time (**backpressure**):

```java
import org.reactivestreams.Subscription;
import reactor.core.publisher.Flux;
import reactor.core.CoreSubscriber;
// ...

@Test
public void backPressure() {
    List<Integer> elements = new ArrayList<>();

    Flux.just(1, 2, 3, 4).log()
            .subscribe(new CoreSubscriber<Integer>() {
                private Subscription s;
                int onNextAmount;

                @Override
                public void onSubscribe(Subscription s) {
                    this.s = s;
                    s.request(2);
                }

                @Override
                public void onNext(Integer integer) {
                    elements.add(integer);
                    onNextAmount++;
                    if (onNextAmount % 2 == 0) {
                        s.request(2);
                    }
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onComplete() {}
            });
    assertThat(elements).containsExactly(1, 2, 3, 4);
}
```

---

### Step 4
Add a test that maps each element from a `Flux` of integers to its double.

```java
@Test
public void fluxMap() {
    List<Integer> elements = new ArrayList<>();

    Flux.just(1, 2, 3, 4).log()
            .map(i -> i * 2)
            .subscribe(elements::add);

    assertThat(elements).containsExactly(2, 4, 6, 8);
}
```

---

### Step 5
Add a test that filters movies by title.

```java
import reactor.core.publisher.Mono;

@Slf4j
public class ReactiveTypes2Test {

    @Test
    public void monoFilter() throws Exception {
        Movie movie = new Movie();
        movie.setTitle("test movie");

        Mono<Movie> movieMono = Mono.just(movie);

        Movie movie2 = movieMono.log()
                .filter(m -> m.getTitle().equalsIgnoreCase("test"))
                .block();

        Assertions.assertThatNullPointerException()
                .isThrownBy(() -> log.info(movie2.toString()));

        Movie movie1 = movieMono.log()
                .filter(m -> m.getTitle().equalsIgnoreCase("test movie"))
                .block();
        log.info(movie1.toString());
    }
}
```

---

### Step 6
Test delay options.
`CountDownLatch` [3] has a counter field that can be decremented.
It can be used to block a calling thread until it has been counted down to zero.

```java
@Test
public void fluxDelay() throws Exception {
    Flux<String> fluxString = Flux.just("one", "two", "three");

    CountDownLatch countDownLatch = new CountDownLatch(1);

    fluxString.delayElements(Duration.ofSeconds(5)).log()
            .doOnComplete(countDownLatch::countDown)
            .subscribe(log::info);

    countDownLatch.await();
}
```

---

### Refactor Repositories

Replace the blocking dependency in `build.gradle`:

```groovy
// Remove:
// implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'

// Add:
implementation 'org.springframework.boot:spring-boot-starter-data-mongodb-reactive'
```

---

### Step 7
Change `MovieRepository` to extend `ReactiveMongoRepository`:

```java
public interface MovieRepository extends ReactiveMongoRepository<Movie, String> {

    Flux<Movie> findByTitle(String title);

    Flux<Movie> findByYearBetween(int start, int end);

    @Query("{ 'year' : { $gt: ?0, $lt: ?1 } }")
    Flux<Movie> findByYearBetweenQ(int start, int end);

    @Query("{ 'title' : { $regex: ?0 } }")
    Flux<Movie> findByTitleRegexp(String regexp);

    Mono<Movie> findById(String id);

    Flux<Movie> findByTitleIsNotNull(Pageable pageable);
}
```

---

### Refactor Services

#### Step 8
Change the return types of methods in `MovieService` to `Flux` or `Mono`.

```java
public interface MovieService {

    Flux<Movie> findAll();

    Mono<Movie> findById(String id);

    Mono<Void> deleteById(String id);

    Mono<Page<Movie>> findPaginated(Pageable pageable);
}
```

The `findPaginated` method returns `Mono<Page<Movie>>` — the stream contains a single `Page<Movie>` element.
The page collects elements from the `Flux` delivered by the `ReactiveMongoRepository`.
The total element count is obtained by zipping with `reactiveMovieRepository.count()`, which returns `Mono<Long>`.

```java
@Service
public class MovieServiceImpl implements MovieService {

    MovieRepository reactiveMovieRepository;

    public MovieServiceImpl(MovieRepository reactiveMovieRepository) {
        this.reactiveMovieRepository = reactiveMovieRepository;
    }

    @Override
    public Mono<Movie> findById(String id) {
        return reactiveMovieRepository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Movie", id)));
    }

    @Override
    public Mono<Void> deleteById(String id) {
        reactiveMovieRepository.deleteById(id).subscribe();
        return Mono.empty();
    }

    @Override
    public Flux<Movie> findAll() {
        return reactiveMovieRepository.findAll();
    }

    @Override
    public Mono<Page<Movie>> findPaginated(Pageable pageable) {
        return this.reactiveMovieRepository.findByTitleIsNotNull(pageable)
                .collectList()
                .zipWith(this.reactiveMovieRepository.count())
                .map(p -> new PageImpl<>(p.getT1(), pageable, p.getT2()));
    }
}
```

---

### Refactor Controller

Replace the web starter in `build.gradle`:

```groovy
// Remove:
// implementation 'org.springframework.boot:spring-boot-starter-web'

// Add:
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

#### Step 9
Change the `RequestMapping` in `IndexController`.
Use **`IReactiveDataDriverContextVariable`** [10].

The presence of a variable of this type in the context sets the Thymeleaf engine into data-driven mode;
only one such variable is allowed per template execution.

Using Reactive Streams terminology, this makes Thymeleaf act as a **Processor** —
it is a Subscriber to the data-driver stream and simultaneously a Publisher of output buffers (usually HTML markup).

Templates executed in data-driven mode are expected to contain exactly one `th:each` iteration over the data-driver variable.

```java
@RequestMapping({"", "/", "/index"})
public String getIndexPage(Model model) {

    IReactiveDataDriverContextVariable reactiveDataDrivenMode =
            new ReactiveDataDriverContextVariable(movieService.findAll(), 10);

    model.addAttribute("movies", reactiveDataDrivenMode);
    return "movieList";
}
```

#### Step 10
Change `MovieController`. The `Rendering` interface [12] is supported as a return value in Spring WebFlux controllers.
Its usage is comparable to `ModelAndView` in Spring MVC — it combines a view name with model attributes
and supports setting HTTP status, headers, and redirect scenarios.

```java
@Controller
@RequestMapping("/movies")
public class MovieController {

    MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @RequestMapping("/info/{id}")
    public Mono<Rendering> showById(@PathVariable String id) {
        Mono<Movie> movie = movieService.findById(id);
        return Mono.just(Rendering.view("movieInfo")
                .modelAttribute("movie", movie).build());
    }

    @RequestMapping("/delete/{id}")
    public String deleteById(@PathVariable String id) {
        movieService.deleteById(id).block();
        return "redirect:/index";
    }

    @RequestMapping({"", "/"})
    public Mono<Rendering> getMoviePage(
            @RequestParam("page") Optional<Integer> page,
            @RequestParam("size") Optional<Integer> size) {
        int currentPage = page.orElse(1);
        int pageSize = size.orElse(10);

        Mono<Page<Movie>> moviePage = movieService.findPaginated(
                PageRequest.of(currentPage - 1, pageSize));

        return Mono.just(Rendering.view("moviePaginated")
                .modelAttribute("moviePage", moviePage).build());
    }
}
```

---

### Refactor ControllerAdvice

#### Step 11
Create `ExceptionHandlerController` annotated with `@ControllerAdvice`:

```java
@ControllerAdvice
public class ExceptionHandlerController {

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(NotFoundException.class)
    public Mono<Rendering> handleNotFoundException(NotFoundException ex, Model model) {
        model.addAttribute("exception", ex);
        model.addAttribute("exceptionType", ex.getClass().getSimpleName());
        return Mono.just(Rendering.view("notFoundException").build());
    }
}
```

#### Step 12
Refactor `showById` to use a reactive pipeline with error propagation.
Instead of creating the `Rendering` directly, `flatMap` is used to transform the found movie,
and `switchIfEmpty` propagates a `NotFoundException` when no movie is found:

```java
@RequestMapping("/info/{id}")
public Mono<Rendering> showById(@PathVariable String id) {
    return movieService.findById(id)
            .flatMap(movie -> Mono.just(Rendering.view("movieInfo")
                    .modelAttribute("movie", movie)
                    .build()))
            .switchIfEmpty(Mono.error(
                    new NotFoundException("Movie not found for id: " + id, id)));
}
```

---

## Kafka

### Event streaming

Serves as a backbone for building data-platforms, event-driven architectures and microservices.
- PUBLISH and SUBSCRIBE: capture data in real-time from event sources (databases, sensors, applications) 
- STORE streams of events durably in a fault-tolerant way, 
- PROCESS and stream it to other systems for processing and analysis.


### Kafka's architectural design:
- Distributed and scalable: runs on a cluster of servers, can handle high throughput.
- Fault-tolerant: replicates data across multiple nodes to prevent data loss.
- Real-time processing: supports low-latency message processing.
- Decoupling: producers and consumers are decoupled, allowing for flexible and scalable architectures.

**Servers**
- Broker: Kafka server that stores and serves messages.
- Kafka Connect: framework for connecting Kafka with external systems (databases, key-value stores, etc.).

**Clients**
- Allows applications to produce and consume messages from Kafka topics.
- Supports various programming languages (Java, Python, etc.) and provides APIs for producers and consumers.
- Kafka Streams: library for building stream processing applications that consume and produce Kafka messages.

### Kafka's core concepts:
- **Event (record or message)**: a record of something that happened, 
  - has a key, a value, a timestamp, and optional metadata headers.
  - Example: a user action, a sensor reading, a database change.
  
- **Topic**: a category or feed name to which messages are published. 
  - Similar to folders in a file system, but for messages.
  - Topics are partitioned and replicated across the cluster over a number of buckets located on different brokers 
for scalability and fault tolerance.
  - Example: "payments".

- **Partition**: a topic is divided into partitions for scalability and parallelism.

- **Producer**: client application that publishes events (messages) to Kafka topics.
- **Consumer**: client application that subscribes to topics and processes events (messages).


### From WebFlux to Kafka 

One of the core ideas in the Reactive Mindset is that **you do not ask for data — you react when it arrives**.
This same mental model is the foundation of Apache Kafka.

| Concept | WebFlux (Project Reactor) | Apache Kafka |
|---|---|---|
| Data model | `Flux<T>` — stream of items | Topic — stream of messages |
| Push model | Reactor emits items downstream | Broker pushes messages to consumers |
| Backpressure | Built into the `Publisher`/`Subscriber` contract | Consumer controls its own poll rate |
| Roles | `Publisher` / `Subscriber` | Producer / Consumer |
| Error handling | `onError`, `switchIfEmpty` | Dead-letter topics, retry policies |

The analogy is useful for understanding the **streaming mindset**. A Kafka consumer does not block waiting for messages —
it reacts when one arrives on a topic. A WebFlux pipeline does not block on a database call —
it defines what to do when the result is ready.

The key difference is **scope**:
- WebFlux handles concurrency *inside* a single service (HTTP request handling, DB access).
- Kafka handles *communication between* services asynchronously.

Both eliminate the blocking "call and wait" pattern at different architectural layers.

---

### Alternative Approach — Virtual Threads (Java 21+)

Since the introduction of Spring Boot 3.2 and Java 21, the implementation of Project Loom's virtual threads has provided a compelling alternative to the reactive programming paradigm for managing high-concurrency workloads.

While reactive programming achieves scalability through non-blocking, functional pipelines, virtual threads allow developers to utilize a traditional, imperative programming style. Because virtual threads are significantly more lightweight than platform threads, the Java Virtual Machine (JVM) can efficiently manage millions of concurrent executions, parking them during I/O operations without exhausting operating system resources. This effectively minimizes the complexity associated with asynchronous code while maintaining comparable throughput.

#### Migration overview

| WebFlux | Virtual Threads (Spring MVC) |
|---|---|
| `Mono<T>` / `Flux<T>` return types | Plain `T` / `List<T>` return types |
| Reactive MongoDB driver | Standard blocking MongoDB driver |
| `flatMap`, `zipWith`, `collectList` chains | Normal method calls, `for` loops |
| `Rendering` with `Mono` wrapper | `String` view name + `Model` |
| Netty server | Tomcat server |

#### Enable virtual threads

Add in `application.properties`:

```properties
spring.threads.virtual.enabled=true
```

This instructs Spring Boot to run every incoming request on a virtual thread via Tomcat's executor.
No other Spring configuration changes are required.

#### What changes in the code

**Dependencies (`build.gradle`):**
```groovy
// Remove:
// implementation 'org.springframework.boot:spring-boot-starter-webflux'
// implementation 'org.springframework.boot:spring-boot-starter-data-mongodb-reactive'

// Add:
implementation 'org.springframework.boot:spring-boot-starter-web'
implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'
```

**Repository** — revert to the standard (blocking) `MongoRepository`:
```java
public interface MovieRepository extends MongoRepository<Movie, String> {
    Page<Movie> findByTitleIsNotNull(Pageable pageable);
}
```

**Service** — remove all reactive operators:
```java
@Override
public Page<Movie> findPaginated(Pageable pageable) {
    return movieRepository.findByTitleIsNotNull(pageable);
}
```

**Controller** — use Spring MVC style:
```java
@RequestMapping({"", "/"})
public String getMoviePage(
        @RequestParam("page") Optional<Integer> page,
        @RequestParam("size") Optional<Integer> size,
        Model model) {
    int currentPage = page.orElse(1);
    int pageSize = size.orElse(10);
    Page<?> moviePage = movieService.findPaginated(
            PageRequest.of(currentPage - 1, pageSize));
    model.addAttribute("moviePage", moviePage);
    return "moviePaginated";
}
```

The Thymeleaf templates require no changes — they already work with `Page<Movie>` directly,
and with virtual threads that value arrives without any reactive wrapper.

---

### Extending the Demo — Spring Boot + Kafka Integration

Add the Kafka dependency to `build.gradle`:

```groovy
implementation 'org.springframework.kafka:spring-kafka'
```

Configure Kafka in `application.properties`:

```properties
# Connection
spring.kafka.bootstrap-servers=localhost:9092

# Producer
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer

# Consumer
spring.kafka.consumer.group-id=movie-group
spring.kafka.consumer.auto-offset-reset=earliest
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer

# JSON Security
spring.kafka.consumer.properties.spring.json.trusted.packages=com.awbd.lab7.events
```

Define a shared event record:

```java
package com.awbd.lab7.events;

import java.time.Instant;

public record MovieEvent(String type, String movieId, String title, Instant timestamp) {}
```

#### Scenario 1 — Movie Deleted Event

When a movie is deleted, publish a `MovieEvent` to the `movie-events` topic.
A consumer (or a second service) reacts to the event — for example,
to update a recommendation engine, send a notification, or write an audit log.

**Producer — inject `KafkaTemplate` into `MovieServiceImpl`:**

```java
@Service
public class MovieServiceImpl implements MovieService {

    private final MovieRepository reactiveMovieRepository;
    private final KafkaTemplate<String, MovieEvent> kafkaTemplate;

    public MovieServiceImpl(MovieRepository reactiveMovieRepository,
                            KafkaTemplate<String, MovieEvent> kafkaTemplate) {
        this.reactiveMovieRepository = reactiveMovieRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public Mono<Void> deleteById(String id) {
        return reactiveMovieRepository.findById(id)
            .flatMap(movie ->
                    reactiveMovieRepository.deleteById(id)
                            .doOnSuccess(v -> kafkaTemplate.send("movie-events",
                                    new MovieEvent("DELETED", id, movie.getTitle(), Instant.now())))
            );
    }
}


@RequestMapping("/delete/{id}")
public String deleteById(@PathVariable String id){
  movieService.deleteById(id);
  return "redirect:/index";
}
```

**Consumer:**

```java
@Component
@Slf4j
public class MovieEventConsumer {

    @KafkaListener(topics = "movie-events", groupId = "movie-group")
    public void onMovieEvent(MovieEvent event) {
        log.info("Event received: type={}, title={}, id={}",
                event.type(), event.title(), event.movieId());
        // e.g. trigger recommendation refresh, send notification, write audit record
    }
}
```

#### Scenario 2 — Collecting User Comments

A frontend or a mobile client publishes user comments about movies to a `movie-comments` topic.
This service consumes those comments, validates them, and persists them to MongoDB.
This demonstrates how Kafka decouples the submission of a comment from its storage —
the client does not wait for the write to complete.

**Define the Comment domain:**

```java
package com.awbd.lab7.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Setter
@Getter
@ToString
@Document(collection = "comments")
public class Comment {

    @Id
    private String id;
    private String movieId;
    private String username;
    private String text;
    private Instant createdAt;
}
```

**Define the incoming event:**

```java
package com.awbd.lab7.events;

public record CommentReceivedEvent(String movieId, String username, String text) {}
```

**Comment repository:**

```java
package com.awbd.lab7.repositories;

import com.awbd.lab7.domain.Comment;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

public interface CommentRepository extends ReactiveMongoRepository<Comment, String> {
    Flux<Comment> findByMovieId(String movieId);
}
```

**Consumer — listen on `movie-comments` and persist to MongoDB:**

```java
package com.awbd.lab7.consumers;

import com.awbd.lab7.domain.Comment;
import com.awbd.lab7.events.CommentReceivedEvent;
import com.awbd.lab7.repositories.CommentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.time.Instant;

@Component
@Slf4j
public class CommentConsumer {

    private final CommentRepository commentRepository;

    public CommentConsumer(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    @KafkaListener(topics = "movie-comments", groupId = "movie-group")
    public void onCommentReceived(CommentReceivedEvent event) {
        log.info("Comment received for movie {}: {}", event.movieId(), event.text());

        Comment comment = new Comment();
        comment.setMovieId(event.movieId());
        comment.setUsername(event.username());
        comment.setText(event.text());
        comment.setCreatedAt(Instant.now());

        commentRepository.save(comment)
                .doOnSuccess(saved -> log.info("Comment persisted with id={}", saved.getId()))
                .doOnError(err -> log.error("Failed to persist comment", err))
                .subscribe();
    }
}
```

**How this ties back to reactive concepts covered in this demo:**

| What you learned here | How it appears in Kafka |
|---|---|
| `Publisher` emits items | Kafka producer publishes messages to a topic |
| `Subscriber` reacts to items | Kafka consumer reacts to messages on a topic |
| Backpressure via `request(n)` | Consumer controls fetch rate via `max.poll.records` |
| `Flux` pipeline (map, filter) | Kafka Streams topology (map, filter, branch) |
| `switchIfEmpty` / `onError` | Dead-letter topics, retry topics |
| `ReactiveMongoRepository.save()` | Persisting inside a consumer is a natural extension |

The core mindset is the same: **define what happens when data arrives, rather than waiting for it**.

---

### Docs

[1] https://www.reactivemanifesto.org/

[2] https://www.baeldung.com/reactor-core

[3] https://www.baeldung.com/java-countdown-latch

[4] https://www.baeldung.com/spring-data-mongodb-reactive

[5] https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html

[6] https://www.baeldung.com/spring-boot-reactor-netty

[7] https://projectreactor.io/docs/core/release/reference/

[8] https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Flux.html

[9] https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Mono.html

[10] https://www.thymeleaf.org/apidocs/thymeleaf-spring6/3.1.0.M1/org/thymeleaf/spring6/context/webflux/IReactiveDataDriverContextVariable.html

[11] https://spring.io/reactive

[12] https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/reactive/result/view/Rendering.html

[13] https://docs.spring.io/spring-kafka/docs/current/reference/html/

[14] https://www.baeldung.com/spring-boot-virtual-threads