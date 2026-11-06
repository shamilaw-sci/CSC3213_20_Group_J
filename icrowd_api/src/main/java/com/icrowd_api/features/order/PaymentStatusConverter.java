package com.icrowd_api.features.order;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = true)
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {

    private static final Logger log = LoggerFactory.getLogger(PaymentStatusConverter.class);

    @Override
    public String convertToDatabaseColumn(PaymentStatus attribute) {
        return attribute != null ? attribute.name() : PaymentStatus.PENDING.name();
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return PaymentStatus.PENDING;
        }

        String normalized = dbData.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        try {
            return PaymentStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown PaymentStatus in database: '{}', falling back to PENDING", dbData);
            return PaymentStatus.PENDING;
        }
    }
}
