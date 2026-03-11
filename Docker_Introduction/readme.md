# Docker Demo 🐳 Redis + Redis Exporter + Prometheus

## Learning Objectives
- How to pull and manage Docker images
- How to create and manage containers
- How Docker networks enable container communication
- How volumes persist data beyond container lifecycle
- How to inspect running containers
- How to execute commands inside containers
- How containers work together in a monitoring stack

---

## Docker Fundamentals Overview

Docker is a toolkit for **containerization**, i.e managing applications as continers.

- Platform for developing, shipping, and running applications.
- Separates applications from infrastructure. Runs on physical or virtual machines, in a data center, on cloud providers etc.

- Runs application in isolated environment, in containers.
- Useful in CI/CD continuous integration, continuous delivery.

### Docker components

- Server or daemon process, docker command.
- REST API interfaces to daemon.
- Command line interface, CLI client  docker command.

### Docker objects

### Images 
An image is a "recipe" or "blueprint" for creating containers, i.e read-only template with instructions to create a container. 

Images are published in a docker registry. To build an image a Dockerfile is created, with instructions for each layer of the image. Rebuilding an image affects only those layers changed in the Dockerfile.

An **image** is a read-only template containing:
- Application code
- Runtime environment
- System libraries
- Dependencies

###	Containers 
A container is a runnable instances of an image. By default, containers can connect to external networks using the host machine’s network connection.
- Isolated from the host system
- Lightweight (shares host OS kernel)
- Ephemeral by default (data is lost when container stops)


###	Networks 
A **network** allows containers to:
- Communicate with each other
- Resolve each other by container name (built-in DNS)
- Be isolated from other networks
- Communicate securely without exposing ports to the host

### Volumes 
A **volume** is persistent storage that:
- Survives container deletion
- Can be shared between containers
- Is managed by Docker
- Stores data outside the container's filesystem

---

## Prerequisites

```bash
# Verify Docker is installed
docker --version

# Verify Docker daemon is running
docker info
```

---

## 📋 Architecture Overview

We'll create 3 containers that communicate:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│     Redis       │◄─────│ Redis Exporter   │◄─────│   Prometheus    │
│   (Port 6379)   │      │   (Port 9121)    │      │   (Port 9090)   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                          │
         └────────────────────────┴──────────────────────────┘
                         docker-network: redis-monitoring
```

---

### Step 1: Create a Docker Network

Containers on the same network can communicate using container names as hostnames.

```bash
# Create a custom bridge network
docker network create redis-monitoring
```

**Verify the network was created:**
```bash
# List all networks
docker network ls

# Inspect the network details
docker network inspect redis-monitoring
```

**What you'll see:**
- Network ID
- Driver type (bridge)
- Subnet and gateway
- Connected containers (empty for now)

---

### Step 2: Pull Required Images

Pulling images first separates the download step from the run step, making troubleshooting easier.

```bash
# Pull Redis official image (latest version)
docker pull redis:latest

# Pull Redis Exporter
docker pull oliver006/redis_exporter:latest

# Pull Prometheus
docker pull prom/prometheus:latest
```

**Verify images are downloaded:**
```bash
# List all images
docker images

# See detailed information about a specific image
docker image inspect redis:latest
```

**What to notice:**
- Image size
- Creation date
- Architecture (amd64, arm64, etc.)
- Layers (images are built in layers)

---

### Step 3: Create a Volume for Redis Data

Persist Redis data even if the container is deleted.

```bash
# Create a named volume
docker volume create redis-data
```

**Verify the volume:**
```bash
# List all volumes
docker volume ls

# Inspect volume details
docker volume inspect redis-data
```

**What you'll see:**
- Mountpoint (where Docker stores the data on your host)
- Driver (local)
- Creation timestamp

---

### Step 4: Run Redis Container

**Use flags**
- `--name`: Give the container a friendly name
- `--network`: Connect to our custom network
- `-v`: Mount the volume to persist data
- `-d`: Run in detached mode (background)
- `-p`: Expose port to host (optional, for direct access)

```bash
docker run -d --name redis-server \
 --network redis-monitoring \
 -v redis-data:/data -p 6379:6379 \
 redis:latest redis-server --appendonly yes
```

- `redis-server --appendonly yes`: Redis persistence mode (AOF)
- `-v redis-data:/data`: Mount volume to `/data` (Redis default data directory)
- `-p 6379:6379`: Map container port 6379 to host port 6379

**Verify Redis is running:**
```bash
# Check container status
docker ps

# Check logs
docker logs redis-server

# Follow logs in real-time (Ctrl+C to stop)
docker logs -f redis-server
```

**Inspect the container:**
```bash
# Detailed container information
docker inspect redis-server

# See which network it's connected to
docker inspect redis-server | grep -A 10 "Networks"

# See mounted volumes
docker inspect redis-server | grep -A 5 "Mounts"
```

**Test Redis connectivity:**
```bash
# Execute redis-cli inside the running container
docker exec -it redis-server redis-cli ping
# Expected output: PONG

# Set a test key
docker exec -it redis-server redis-cli SET mykey "Hello Docker"

# Get the key
docker exec -it redis-server redis-cli GET mykey
```

---

### Step 5: Run Redis Exporter Container

Redis Exporter connects to Redis and exposes metrics in Prometheus format.

```bash
docker run -d \
  --name redis-exporter \
  --network redis-monitoring \
  -p 9121:9121 \
  oliver006/redis_exporter:latest \
  --redis.addr=redis-server:6379
```

- `--redis.addr=redis-server:6379`: Connect to Redis using container name
    - This works because both containers are on the same network!
    - Docker's built-in DNS resolves `redis-server` to the container's IP

**Verify Redis Exporter:**
```bash
# Check logs
docker logs redis-exporter

# Test the metrics endpoint from your host
curl http://localhost:9121/metrics
```

**What to look for in metrics:**
- `redis_up{...} 1` (Redis is reachable)
- `redis_connected_clients`
- `redis_commands_total`
- `redis_keyspace_hits_total`
- `redis_keyspace_misses_total`

---
**config file prometheus.yml:**
- `scrape_interval`: How often Prometheus collects metrics
- `job_name`: Logical grouping of targets
- `targets`: Where to scrape metrics (using container name!)
- `labels`: Additional metadata for filtering
---

### Step 6: Run Prometheus Container

**Use flags:**
- `-v`: Mount config file into the container
- `--network`: Connect to our network to reach redis-exporter

```bash
docker run -d \
  --name prometheus \
  --network redis-monitoring \
  -p 9090:9090 \
  -v ~/prometheus-config/prometheus.yml:/etc/prometheus/prometheus.yml \
  -v ~/prometheus-config/alerts.yml:/etc/prometheus/alerts.yml \ 
  prom/prometheus:latest
```

**Verify Prometheus:**
```bash
# Check logs
docker logs prometheus

# Access Prometheus UI in your browser
# http://localhost:9090
```

**In the Prometheus UI:**
1. Go to **Status → Targets**
    - You should see `redis (1/1 up)` - the exporter is being scraped
2. Go to **Graph** tab
    - Try query: `redis_up`
    - You should see value `1`

---

## Prometheus: Metrics, Exporters, and PromQL

Prometheus is a **pull-based** monitoring system. Instead of applications sending metrics to Prometheus (push), Prometheus actively **scrapes** (pulls) metrics from configured endpoints at regular intervals.

### The Metrics Endpoint

A metrics endpoint is an HTTP URL that returns metrics in Prometheus text format when accessed.

**Example: Redis Exporter Endpoint**
```bash
# Access the metrics endpoint
curl http://localhost:9121/metrics
```

**Metric Format:**
- `# HELP`: Description of the metric
- `# TYPE`: Metric type (gauge, counter, histogram, summary)
- Metric name followed by value
- Optional labels in curly braces: `redis_db_keys{db="db0"} 5`

**Exporters:**
- Exporters are **translators** between native application formats and Prometheus format
- They expose a `/metrics` endpoint that Prometheus can scrape
- They run as separate processes (perfect for sidecar pattern in K8s!)
- Common exporters: Node Exporter (system metrics), MySQL Exporter, Nginx Exporter

---

### Metric Types

**1. Counter** - Only goes up (until reset)
```
redis_keyspace_hits_total 42
redis_keyspace_hits_total 45  # 3 seconds later
redis_keyspace_hits_total 48  # 3 seconds later
```
Use for: requests, errors, cache hits/misses

**2. Gauge** - Can go up or down
```
redis_connected_clients 5
redis_connected_clients 3  # 2 clients disconnected
redis_connected_clients 7  # 4 clients connected
```
Use for: memory usage, active connections, queue depth

**3. Histogram** - Buckets of observations
```
redis_commands_latencies_usec_bucket{le="0.001"} 100
redis_commands_latencies_usec_bucket{le="0.01"} 150
redis_commands_latencies_usec_bucket{le="0.1"} 152
```
Use for: latencies, request sizes

**4. Summary** - Similar to histogram, pre-calculated percentiles
Use for: latencies when you don't need custom percentiles

---


## Testing: Generate Cache Hits and Misses

### Create a Test Script

**Option 1: Python script**
```bash
# Install Redis Python client if not already installed
pip3 install redis

# Run the script
python3 ~/redis_cache_test.py
```

**Option 2: Bash script**
```bash
./redis_cache_test.sh
```

---

## Viewing Results in Prometheus

### 1. Access Prometheus UI
Open your browser: http://localhost:9090

### 2. PromQl Queries

PromQL: Prometheus Query Language

PromQL is Prometheus's query language for selecting and aggregating time-series data.

**Check Redis is up:**

Metric Type: gauge

Binary gauge (1 = up, 0 = down). Represents current state, can change in either direction.

```promql
redis_up
```

**Cache hit rate (percentage):**

Base Metrics: counter (redis_keyspace_hits_total, redis_keyspace_misses_total)

Result Type: Calculated gauge (percentage)

Uses two counters with rate() to calculate a ratio, resulting in a gauge value (0-100%).

```promql
rate(redis_keyspace_hits_total[1m]) / (rate(redis_keyspace_hits_total[1m]) + rate(redis_keyspace_misses_total[1m])) * 100
```

**Latencies**
Base Metrics: histogram

Count of commands that completed in ≤ 4 microseconds

```promql
redis_commands_latencies_usec_bucket{le="4.0"}
```

**Total commands processed:**
```promql
rate(redis_commands_total[1m])
```

**Number of keys in database:**
```promql
redis_db_keys
```

**Memory usage:**
```promql
redis_memory_used_bytes
```

**Cache misses over time:**
```promql
rate(redis_keyspace_misses_total[5m])
```

### 3. Visualize with Graphs

1. Click **Graph** tab
2. Enter query
3. Click **Execute**
4. Switch to **Graph** view
5. Adjust time range (top right)

---

## Container Management Commands

### Inspecting Containers

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs redis-server
docker logs redis-exporter
docker logs prometheus

# Stream logs in real-time
docker logs -f redis-server

# View last 100 lines
docker logs --tail 100 redis-server

# Show resource usage
docker stats redis-server redis-exporter prometheus

# Detailed container information
docker inspect redis-server
```

### Executing Commands in Containers

```bash
# Run a command in the container
docker exec redis-server redis-cli INFO

# Interactive shell
docker exec -it redis-server /bin/bash

# Interactive redis-cli session
docker exec -it redis-server redis-cli

# Monitor Redis in real-time
docker exec -it redis-server redis-cli MONITOR
```

### Managing Containers

```bash
# Stop a container
docker stop redis-server

# Start a stopped container
docker start redis-server

# Restart a container
docker restart redis-server

# Remove a container (must be stopped first)
docker stop redis-server
docker rm redis-server

# Force remove a running container
docker rm -f redis-server
```

---

## Cleanup

### Stop and Remove All Containers

```bash
# Stop all containers
docker stop redis-server redis-exporter prometheus

# Remove all containers
docker rm redis-server redis-exporter prometheus
```

### Remove Network

```bash
docker network rm redis-monitoring
```

### Remove Volume (This deletes all Redis data!)

```bash
docker volume rm redis-data
```

### Remove Images (Optional)

```bash
docker rmi redis:latest
docker rmi oliver006/redis_exporter:latest
docker rmi prom/prometheus:latest
```

### Clean Everything

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Nuclear option: remove everything
docker system prune -a --volumes
```

---

## Summary

### Images vs Containers
- **Image**: Template/blueprint (immutable)
- **Container**: Running instance (mutable, ephemeral)
- One image can spawn many containers

### Networking
- Containers on the same network can communicate by name
- Docker provides built-in DNS
- Networks isolate container communication

### Volumes
- Persist data beyond container lifecycle
- Can be shared between containers
- Managed by Docker (you don't need to know the exact path)

### Port Mapping
- `-p host:container` exposes container port to host
- Not required for container-to-container communication on the same network

### Execution
- `docker run`: Create and start a new container
- `docker exec`: Run command in existing running container
- `-it`: Interactive terminal
- `-d`: Detached (background) mode

---

### Exercises

#### 1. Remove redis container and create a new container using the same volume. Did the data persist?
```
-v redis-data:/data
```

Check the number of keys using the old and the new container.

```
docker exec redis-server redis-cli DBSIZE
```

#### 2. Trigger the alert RedisDown by disconnecting redis-server from the network redis-monitorig.

```
# Disconnect Redis from monitoring network
docker network disconnect redis-monitoring redis-server

docker network connect redis-monitoring redis-server
```

#### 3. Create a RedisCacheHitRateLow alert in Prometheus. Trigger the alert simulating a scenario of successive SET and GET commands with a HitRate below 50%.

Hint:
```
rate(redis_keyspace_hits_total[1m])
rate(redis_keyspace_misses_total[1m])
```

#### 4. Run 2 Redis instances, on port 6379 and 6380 and configure Prometheus to scrape both. 

#### 5 Run Redis with memory limit and trigger eviction.

```
# Stop Redis
docker stop redis-server
docker rm redis-server

# Restart with memory limit
docker run -d \
--name redis-server \
--network redis-monitoring \
-v redis-data:/data \
-p 6379:6379 \
redis:latest \
redis-server --maxmemory 50mb --maxmemory-policy allkeys-lru --appendonly yes
```
