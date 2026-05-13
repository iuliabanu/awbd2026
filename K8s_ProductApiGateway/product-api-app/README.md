# Product Service with Cache-Aside Pattern

A Spring Boot microservice implementing a product search API with cache-aside strategy using Redis and MySQL.

## Architecture

- **Spring Boot 4.0.1** - REST API framework
- **MySQL** - Primary database
- **Redis** - Caching layer
- **Docker** - Containerization

## Cache-Aside Pattern

The service implements the cache-aside (lazy loading) pattern:

1. **Read**: Check cache → Cache miss → Query database → Store in cache → Return
2. **Write**: Update database → Invalidate cache
3. **Delete**: Delete from database → Invalidate cache

## Project Structure

```
.
├── build.gradle                 # Gradle build configuration
├── settings.gradle              # Gradle settings
├── Dockerfile                   # Application container
├── docker-compose.yml           # Multi-container orchestration
├── .dockerignore               # Docker build exclusions
└── src/
    └── main/
        ├── java/com/awbd/productservice/
        │   ├── ProductServiceApplication.java    # Main application
        │   ├── config/
        │   │   └── RedisConfig.java             # Redis configuration
        │   ├── controller/
        │   │   └── ProductController.java       # REST endpoints
        │   ├── model/
        │   │   └── Product.java                 # Product entity
        │   ├── repository/
        │   │   └── ProductRepository.java       # JPA repository
        │   └── service/
        │       └── ProductService.java          # Business logic with caching
        └── resources/
            └── application.properties           # Configuration
```

## Setup and Running

### Prerequisites
- Docker and Docker Compose installed
- Ports 3306, 6379, and 8080 available

### Start All Services

```bash
# Build and start all containers
docker-compose up --build

# Run in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f app
```

### Stop Services

```bash
docker-compose down

# Remove volumes (clears database)
docker-compose down -v
```

## API Endpoints

### Base URL
```
http://localhost:8080/api/products
```

### 1. Create Product
```bash
POST /api/products
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 1299.99,
  "quantity": 50
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 1299.99,
    "quantity": 50
  }'
```

### 2. Get Product by ID (Cache-Aside)
```bash
GET /api/products/{id}
```

**Example:**
```bash
curl http://localhost:8080/api/products/1
```

**First request:** Cache MISS → Database query → Cache store
**Subsequent requests:** Cache HIT → No database query

### 3. Update Product
```bash
PUT /api/products/{id}
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "description": "High-end gaming laptop",
  "price": 1599.99,
  "quantity": 30
}
```

**Example:**
```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-end gaming laptop",
    "price": 1599.99,
    "quantity": 30
  }'
```

**Cache behavior:** Invalidates cache on update

### 4. Delete Product
```bash
DELETE /api/products/{id}
```

**Example:**
```bash
curl -X DELETE http://localhost:8080/api/products/1
```

**Cache behavior:** Invalidates cache on delete

## Testing the Cache

### Test Cache-Aside Pattern

1. **Create a product:**
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Testing cache",
    "price": 99.99,
    "quantity": 100
  }'
```

2. **First GET (Cache MISS):**
```bash
curl http://localhost:8080/api/products/1
```
Check logs: `Cache MISS for product ID: 1`

3. **Second GET (Cache HIT):**
```bash
curl http://localhost:8080/api/products/1
```
Check logs: `Cache HIT for product ID: 1`

4. **Update product (Cache invalidation):**
```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product",
    "description": "Cache invalidated",
    "price": 149.99,
    "quantity": 75
  }'
```

5. **Next GET (Cache MISS again):**
```bash
curl http://localhost:8080/api/products/1
```
Check logs: `Cache MISS for product ID: 1` (cache was invalidated)

## Monitoring

### View Application Logs
```bash
docker-compose logs -f app
```

### Access MySQL
```bash
docker exec -it product-mysql mysql -uroot -ppassword productdb
```

```sql
SELECT * FROM products;
```

### Access Redis CLI
```bash
docker exec -it product-redis redis-cli
```

```redis
KEYS product:*
GET product:1
TTL product:1
```

## Configuration

### Environment Variables

Edit `docker-compose.yml` to customize:

```yaml
environment:
  MYSQL_HOST: mysql
  MYSQL_PORT: 3306
  MYSQL_DATABASE: productdb
  MYSQL_USER: root
  MYSQL_PASSWORD: password
  REDIS_HOST: redis
  REDIS_PORT: 6379
```

### Cache TTL

Edit `ProductService.java`:
```java
private static final long CACHE_TTL = 1; // 1 hour
```
---

### Dockerhub
Connect to dockerhub and build a docker image for the Spring Boot App.

```
docker build -t username/product-service .

docker push username/product-service
```