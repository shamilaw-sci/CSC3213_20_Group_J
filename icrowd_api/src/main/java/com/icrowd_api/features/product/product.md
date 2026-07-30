# Product Feature - Backend Implementation

This module handles the core business logic, database operations, and API endpoints for products.

## What We Have Implemented
- **Data Entities:** Defined JPA entities for `Product` and `Category`, including mapping product images and tags into separate collections (`@ElementCollection`) for efficient storage.
- **RESTful API:** Created the `ProductController` exposing endpoints for fetching products, retrieving a single product by ID, and getting search suggestions.
- **Advanced Querying:** Implemented `ProductRepository` with Spring Data JPA to support paginated queries, keyword searching across names and descriptions, and category filtering.
- **Search Suggestions:** Added a `getSearchSuggestions` service that utilizes the Levenshtein distance algorithm to find fuzzy keyword matches, helping correct customer typos.
- **Data Integrity Validation:** Applied `jakarta.validation.constraints` (like `@PositiveOrZero`) to ensure negative prices or stock cannot be saved to the database.
