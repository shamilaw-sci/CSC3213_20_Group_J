-- PostgreSQL installations with automatic schema updates disabled.
CREATE TABLE IF NOT EXISTS storefront_hero (
    id BIGINT PRIMARY KEY,
    headline VARCHAR(255),
    subtitle VARCHAR(255),
    image BYTEA,
    content_type VARCHAR(255),
    image_version VARCHAR(255)
);
