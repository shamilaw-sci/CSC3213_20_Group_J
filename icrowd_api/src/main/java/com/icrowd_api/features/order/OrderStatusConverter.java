package com.icrowd_api.features.order;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = true)
public class OrderStatusConverter implements AttributeConverter<OrderStatus, String> {

    private static final Logger log = LoggerFactory.getLogger(OrderStatusConverter.class);

    @Override
    public String convertToDatabaseColumn(OrderStatus attribute) {
        // Hibernate also applies this converter to optional status query parameters.
        // Replacing null with PENDING turns an unfiltered search into a status filter.
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public OrderStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return OrderStatus.PENDING;
        }

        String normalized = dbData.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        try {
            return OrderStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown OrderStatus in database: '{}', falling back to PENDING", dbData);
            return OrderStatus.PENDING;
        }
    }
}
