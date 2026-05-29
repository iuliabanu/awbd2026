package com.awbd.cartapi.client;
import com.awbd.cartapi.dto.StockUpdateRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ProductStockClient {
    private static final Logger log = LoggerFactory.getLogger(ProductStockClient.class);
    private final RestClient restClient;
    private final String productServiceUri;
    private static final String CB_NAME = "product-stock";

    public ProductStockClient(RestClient restClient,
                              @Value("${product.service.uri}") String productServiceUri) {
        this.restClient = restClient;
        this.productServiceUri = productServiceUri;
    }

    /** throws RuntimeException on failure so
     * the Saga can trigger compensation.
     */
    @CircuitBreaker(name = CB_NAME, fallbackMethod = "updateStockFallback")
    public void updateStock(Long productId, int delta) {
        String url = productServiceUri + "/api/products/" + productId + "/stock";
        StockUpdateRequest request = new StockUpdateRequest(delta);
        restClient.patch()
                .uri(url)
                .body(request)
                .retrieve()
                .toBodilessEntity();
        log.info("Stock updated for product {} with delta {}", productId, delta);
    }
    public void updateStockFallback(Long productId, int delta, Throwable t) {
        log.error("Circuit breaker OPEN — cannot update stock for product {}: {}", productId, t.getMessage());
        throw new RuntimeException("product-api unavailable — cannot update stock for product " + productId);
    }
}