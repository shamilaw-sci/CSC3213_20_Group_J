package com.icrowd_api.features.order;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = true)
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {

    private static final Logger log = LoggerFactory.getLogger(PaymentMethodConverter.class);

    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        return attribute != null ? attribute.name() : PaymentMethod.COD.name();
    }

    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return PaymentMethod.COD;
        }

        String normalized = dbData.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        try {
            return PaymentMethod.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown PaymentMethod in database: '{}', falling back to COD", dbData);
            return PaymentMethod.COD;
        }
    }
}
