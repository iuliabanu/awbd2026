package com.awbd.productservice.service;

import com.awbd.productservice.model.Product;
import com.awbd.productservice.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class ProductService {
    
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    private static final String CACHE_PREFIX = "product:";
    private static final long CACHE_TTL = 1; // 1 hour
    
    private final ProductRepository productRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public ProductService(ProductRepository productRepository, RedisTemplate<String, Object> redisTemplate) {
        this.productRepository = productRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Cache-Aside Pattern Implementation:
     * 1. Check cache first
     * 2. If cache miss, query database
     * 3. Store result in cache before returning
     */
    public Optional<Product> getProductById(Long id) {
        String cacheKey = CACHE_PREFIX + id;
        
        // Step 1: Try to get from cache
        Product cachedProduct = (Product) redisTemplate.opsForValue().get(cacheKey);
        
        if (cachedProduct != null) {
            log.info("Cache HIT for product ID: {}", id);
            return Optional.of(cachedProduct);
        }
        
        // Step 2: Cache miss - query database
        log.info("Cache MISS for product ID: {}", id);
        Optional<Product> product = productRepository.findById(id);
        
        // Step 3: Store in cache if found
        product.ifPresent(p -> {
            redisTemplate.opsForValue().set(cacheKey, p, CACHE_TTL, TimeUnit.HOURS);
            log.info("Cached product ID: {}", id);
        });
        
        return product;
    }

    public Product createProduct(Product product) {
        Product savedProduct = productRepository.save(product);
        log.info("Created product with ID: {}", savedProduct.getId());
        return savedProduct;
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setQuantity(productDetails.getQuantity());
        
        Product updatedProduct = productRepository.save(product);
        
        // Invalidate cache
        String cacheKey = CACHE_PREFIX + id;
        redisTemplate.delete(cacheKey);
        log.info("Updated and invalidated cache for product ID: {}", id);
        
        return updatedProduct;
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
        
        // Invalidate cache
        String cacheKey = CACHE_PREFIX + id;
        redisTemplate.delete(cacheKey);
        log.info("Deleted and invalidated cache for product ID: {}", id);
    }
}
