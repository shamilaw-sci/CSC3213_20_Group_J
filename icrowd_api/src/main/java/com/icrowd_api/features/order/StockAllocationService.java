package com.icrowd_api.features.order;

import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class StockAllocationService {
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    private final ProductRepository products;
    public StockAllocationService(ProductRepository products) { this.products = products; }

    // Caller holds the order lock. All product locks remain held until commit.
    @Transactional
    public boolean allocate(Order order) {
        if (order.isStockAllocated()) return true;
        Map<Long, Integer> quantities = new TreeMap<>();
        for (OrderItem item : order.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() <= 0)
                throw new IllegalArgumentException("Quantity must be positive");
            quantities.merge(item.getProduct().getId(), item.getQuantity(), Math::addExact);
        }
        Map<Long, Product> locked = new LinkedHashMap<>();
        for (var entry : quantities.entrySet()) {
            Product product = products.findForCheckout(entry.getKey()).orElseThrow();
            // Order creation may already have loaded this entity before a competing checkout committed.
            entityManager.refresh(product, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
            locked.put(entry.getKey(), product);
            if (!Boolean.TRUE.equals(product.getIsActive()) || product.getAvailableStock() < entry.getValue()) {
                order.setUnavailableProductId(product.getId());
                order.setUnavailableProductName(product.getName());
                return false;
            }
        }
        quantities.forEach((id, quantity) -> {
            Product product = locked.get(id);
            product.setAvailableStock(product.getAvailableStock() - quantity);
        });
        order.setStockAllocated(true);
        return true;
    }
}
