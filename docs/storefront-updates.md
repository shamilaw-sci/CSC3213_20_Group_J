# Storefront updates

- Admins can open **Manage store → Homepage banner** (`/admin/storefront`) to upload a JPEG/PNG, edit the heading and description, preview changes, and save. The image and text are stored in the database and served to all visitors. Only admins can write; public requests can read the banner.
- Default artwork: `iCrowd_UI/public/images/storefront-hero.png`. It remains available when no custom image is saved or an image cannot load. Uploads are checked by size, dimensions, and decoded image format, then re-encoded before storage. Use a wide image with space on the left for text.
- Production PostgreSQL databases with automatic schema updates disabled need `database_migrations/20261112_storefront_hero.sql`. Local development keeps the repository's existing automatic-schema behavior.
- Cart promotions are fetched for the signed-in customer and current subtotal. Only currently valid codes are listed; manual codes use the same validation. Quantity changes revalidate the discount. Shipping quotes and final order creation calculate prices and discounts on the server.
- Price filters accept multiples of LKR 500. Product cards, search suggestions, cart and checkout use LKR.
- Customer order history reads only the authenticated customer's orders. Sample order and promotion cards have been removed.

## Default artwork provenance

Generated with the built-in image generation tool. Prompt:

> Create a premium photorealistic ecommerce website hero background for a Sri Lankan consumer electronics shop selling smartphones, headphones, wireless earbuds, power banks and cases. Wide landscape composition, 1536x1024 or wider. Matte midnight navy studio background; tasteful cool blue and soft silver lighting. Place an elegant unbranded smartphone, over-ear headphones, earbuds in an open case and compact power bank on architectural plinths in the RIGHT HALF. LEFT HALF is uncluttered dark negative space for white webpage heading and a button, no text in the image itself. Realistic refined product photography, clear silhouettes, grounded shadows, no logos, no labels, no watermarks, no people. Image should work cropped to a wide 2.5:1 hero banner.
