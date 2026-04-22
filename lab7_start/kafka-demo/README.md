## Kafka Demo

This demo shows how to use **Apache Kafka** as a message broker.  
Messages (movie comments) are produced by a publisher and consumed by a subscriber via a Kafka topic.

### Prerequisites

Make sure the Kafka container is running before executing any of the commands below:

```
docker-compose up -d
```

---

### Step 1 – Create a Kafka Topic

A **topic** is a named channel where messages are sent and received.  
Run this command once to create the `movie-comment` topic inside the Kafka container:

```
docker exec -it "kafka" /opt/kafka/bin/kafka-topics.sh `
--create `
--topic "movie-comment" `
--bootstrap-server localhost:9092 `
--partitions 1 `
--replication-factor 1
```

---

### Step 2 – Start a Producer

A **producer** sends messages to a topic.  
Run this command to open an interactive producer session — you can type or paste messages directly:

```
docker exec -it "kafka" /opt/kafka/bin/kafka-console-producer.sh `
--bootstrap-server localhost:9092 `
--topic "movie-comment"
```

Once the prompt (`>`) appears, paste a sample message in JSON format, for example:

```
{"movieId":"507f1f77bcf86cd799439011","username":"alice","text":"Great film, highly recommended!"}
```

Press **Enter** to send the message. Type more messages or press **Ctrl+C** to exit.

---

### Step 3 – Start a Consumer

A **consumer** reads messages from a topic.  
Open a **new terminal** and run this command to listen for all messages (including past ones) on the topic:

```
docker exec -it "kafka" /opt/kafka/bin/kafka-console-consumer.sh `
--bootstrap-server localhost:9092 `
--topic "movie-comment" `
--from-beginning
```

You should see the messages you sent in Step 2 appear here.  
Press **Ctrl+C** to stop the consumer.

---

### How it fits into the application

In the Spring WebFlux application, a **Kafka listener** (`@KafkaListener`) automatically receives messages posted to `movie-comment` and saves them as comments linked to the corresponding movie in MongoDB.
