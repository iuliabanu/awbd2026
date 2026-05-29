package com.awbd.productservice.service;

import com.awbd.productservice.client.DiscountClient;
import com.awbd.productservice.model.Discount;
import com.awbd.productservice.model.EnrichedProduct;
import com.awbd.productservice.model.Product;
import com.awbd.productservice.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class ProductService {
    
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    private static final String CACHE_PREFIX = "product:";
    private static final long CACHE_TTL = 1; // 1 hour
    
    private final ProductRepository productRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final DiscountClient discountClient;

    public ProductService(ProductRepository productRepository,
                          RedisTemplate<String, Object> redisTemplate,
                          DiscountClient discountClient) {
        this.productRepository = productRepository;
        this.redisTemplate = redisTemplate;
        this.discountClient = discountClient;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Page<Product> getProductsPage(Pageable pageable, String search) {
        if (search != null && !search.isBlank()) {
            return productRepository.findByNameContaining(search, pageable);
        }
        return productRepository.findAll(pageable);
    }

    public Optional<Product> getProductById(Long id) {
        String cacheKey = CACHE_PREFIX + id;

        Product cachedProduct = (Product) redisTemplate.opsForValue().get(cacheKey);
        
        if (cachedProduct != null) {
            log.info("Cache HIT for product ID: {}", id);
            return Optional.of(cachedProduct);
        }

        log.info("Cache MISS for product ID: {}", id);
        Optional<Product> product = productRepository.findById(id);

        product.ifPresent(p -> {
            redisTemplate.opsForValue().set(cacheKey, p, CACHE_TTL, TimeUnit.HOURS);
            log.info("Cached product ID: {}", id);
        });
        
        return product;
    }

    /**
     * Aggregation pattern: fetches the product (cache-aside) then calls
     * discount-service via DiscountClient (circuit-breaker protected).
     * If discount-service is down the call returns Discount.unavailable()
     * and this method still returns a complete EnrichedProduct (graceful degradation).
     */
    public Optional<EnrichedProduct> getEnrichedProduct(Long id) {
        return getProductById(id).map(product -> {
            Discount discount = discountClient.getDiscount(id);
            return EnrichedProduct.of(product, discount);
        });
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

        String cacheKey = CACHE_PREFIX + id;
        redisTemplate.delete(cacheKey);
        log.info("Updated and invalidated cache for product ID: {}", id);
        
        return updatedProduct;
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);

        String cacheKey = CACHE_PREFIX + id;
        redisTemplate.delete(cacheKey);
        log.info("Deleted and invalidated cache for product ID: {}", id);
    }

    /**
     * Atomically applies a delta to the product's stock quantity.
     * Used by cart-api-app during checkout (Saga Step 3).
     * delta < 0 = decrement (reserve), delta > 0 = increment (compensate/release).
     * Throws IllegalStateException if the result would go below 0.
     */
    @Transactional
    public Product updateStock(Long id, int delta) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        int newQuantity = product.getQuantity() + delta;
        if (newQuantity < 0) {
            throw new IllegalStateException(
                "Insufficient stock for product " + id + ": requested " + (-delta) + ", available " + product.getQuantity());
        }
        product.setQuantity(newQuantity);
        Product saved = productRepository.save(product);

        String cacheKey = CACHE_PREFIX + id;
        redisTemplate.delete(cacheKey);
        log.info("Stock updated for product {}: delta={}, new quantity={}", id, delta, newQuantity);
        return saved;
    }
}
