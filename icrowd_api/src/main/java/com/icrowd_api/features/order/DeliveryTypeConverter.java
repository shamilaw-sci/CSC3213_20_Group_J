package com.icrowd_api.features.order;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = true)
public class DeliveryTypeConverter implements AttributeConverter<DeliveryType, String> {

    private static final Logger log = LoggerFactory.getLogger(DeliveryTypeConverter.class);

    @Override
    public String convertToDatabaseColumn(DeliveryType attribute) {
        return attribute != null ? attribute.name() : DeliveryType.STANDARD.name();
    }

    @Override
    public DeliveryType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return DeliveryType.STANDARD;
        }

        String normalized = dbData.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        try {
            return DeliveryType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown DeliveryType in database: '{}', falling back to STANDARD", dbData);
            return DeliveryType.STANDARD;
        }
    }
}
