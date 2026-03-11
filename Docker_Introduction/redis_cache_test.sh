#!/bin/bash

echo "Starting Redis cache hit/miss test..."
echo "------------------------------------------------"

# Set some initial keys
for i in {1..5}; do
    docker exec redis-server redis-cli SET "product:$i" "Data for product $i"
    echo "✓ Set product:$i"
done

echo ""
echo "------------------------------------------------"
echo "Simulating cache hits and misses..."
echo "------------------------------------------------"
echo ""

# Generate random access patterns
for i in {1..30}; do
    if [ $((RANDOM % 10)) -lt 7 ]; then
        # Cache HIT (70% probability)
        key="product:$((RANDOM % 5 + 1))"
        result=$(docker exec redis-server redis-cli GET "$key")
        echo "HIT  → $key: $result"
    else
        # Cache MISS (30% probability)
        key="product:$((RANDOM % 100 + 100))"
        result=$(docker exec redis-server redis-cli GET "$key")
        echo "MISS → $key: (nil)"
    fi
    sleep 0.5
done

echo ""
echo "================================================"
echo "REDIS STATISTICS"
echo "================================================"
docker exec redis-server redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses|total_commands"