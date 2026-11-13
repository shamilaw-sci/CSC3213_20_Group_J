# Product recommendations

The existing API response remains a list of products, so storefront callers remain compatible.

- Home recommendations use successful purchase categories and saved cart categories. Products already purchased or in the saved cart are excluded. Recent successful sales fill remaining places.
- Cart recommendations first use products appearing together in delivered/completed orders, followed by category matches and general recommendations. Current cart items are excluded.
- Similar products rank category, comparable price, brand, shared tags and a review-count-adjusted rating. The rating prior is 3 stars with five reviews, reducing the influence of a single review.
- Recommendation and featured candidates must be active and have positive stock. Latest arrivals retain their existing catalog behavior.
- Failed, cancelled, refunded and unpaid orders do not count as purchase or popularity signals.
- Recommendation limits are capped at 100; zero/negative limits return empty results.

Limitations: bought-together evidence does not guarantee device compatibility. No browsing tracking, wishlist signals, recommendation explanations, click analytics, or purchase-recency weighting is introduced. Purchased products are excluded regardless of whether they are consumable. Similarity reranks a bounded candidate pool; this is a rule-based system, not a trained model.
