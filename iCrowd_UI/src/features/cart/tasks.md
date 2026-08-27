# Cart Management and Purchasing system

 - [/] in the cart , customer can be manage product 
    - [x] need to be able to increase or decrease quantities,
    - [x] or entirely delete product from the cart
    - [x] if quantity decrease up to 0 product need to be automatically delete from the cart
    - [x] the maximum quantity customer can increased not to be more than item count that stock has
- [x] when ever the add to cart butter triggers in UI 1 quatity of product need to add to cart other than product stock not available or product is block by the system
- [x] customer can be go back to catalog and shop through it if they want, and cart details remain , and if customer add new items cart need update with that
- [/] order summary section:
    - [x] total amount is cart need to be calculated and render on screen
    - [ ] if there is promotion on product or customer, total discount like things need to be calculated and reduced amount need to be shown, and final amount need to be shown,
    - [x] there is place to customer to add promotions they have using or selecting by them
    - [x] there need to proceed checkout button
- [/] in product catalog cart buttom UI need to be change to cart logo
- [/] there need to product suggestion system(product you may like at the bottom of the cart) - we will write the logic for this later. just we need porduct you may like section like the catalog
- [x] make cart page with relevan url update in the mainLayout
- [x] if customer log out or close the browser accidently while the shopping , when he or she came back to site the card need to remained as same
 
# Last Item Problem

## Phase 1: The Database Safety Net (PostgreSQL)
- [ ] Before writing any application code, you must secure the database. The database is your absolute source of truth and must physically reject invalid data.Add a Check Constraint: Ensure the database refuses any command that would drop inventory below zero.SQLALTER TABLE products ADD CONSTRAINT check_quantity CHECK (quantity >= 0);
```Why this matters: If a race condition somehow bypasses your Spring Boot logic, PostgreSQL will throw an exception instead of recording a -1 inventory. ```

## Phase 2: Browsing & Cart (React)
- [ ] During this phase, the system applies no locks and makes no promises.Catalog Display: React fetches the product list. If quantity > 0, it shows "Add to Cart". If quantity == 0, it shows "Out of Stock".Adding to Cart: When a user clicks "Add to Cart," React simply adds the item to the cart's local state.Multiple Users: If 100 users add the same "last item" to their carts, the system allows all of them. The inventory in the database remains 1.

## Phase 3: The Checkout Race (React to Spring Boot)
```This is where the actual race begins. Multiple users have filled out their shipping and payment details and click "Pay Now" at the exact same millisecond.```
- [ ] The API Call: React sends a single POST /api/orders/checkout request. The payload contains the cart items (e.g., Product A, Product B) and the payment token.The Loading State: The "Pay Now" button turns into a spinner. React waits for the server's response.

## Phase 4: The Backend Resolution (Spring Boot)
When multiple requests hit your server simultaneously, Spring Boot acts as the traffic controller.
- [ ] 1.Open a Strict Transaction:The entire checkout method is annotated with @Transactional. This ensures that if any part of the order fails (like one out of five items being out of stock), the entire database interaction is rolled back to its original state.
- [ ] 2.Execute Atomic Decrements:For each item in the order, Spring Boot executes an atomic SQL UPDATE rather than doing a SELECT followed by an UPDATE.UPDATE products SET quantity = quantity - 1 WHERE id = :productId AND quantity >= 1;
- [ ] 3.Check the Update Result:Spring Boot checks how many rows that SQL query modified.If it returns 1, the inventory was successfully claimed.If it returns 0, it means the quantity >= 1 condition failed. The item is sold out.
- [ ] 4.Halt and Throw Detailed Exception:Crucial for partial cart failures.If the update returns 0, Spring Boot immediately stops processing. It throws a custom OutOfStockException(failedProductId). Because of the @Transactional annotation, any inventory claimed in Step 2 is instantly returned to the database.
- [ ] 5.Return a Specific Error Payload:A global exception handler catches the OutOfStockException and returns a 409 Conflict HTTP response to React. The JSON body specifically includes {"error": "OUT_OF_STOCK", "productId": "123"}.
- [ ] 6.Process Payment (Winners Only):If, and only if, all atomic decrements succeed, Spring Boot contacts the payment gateway (like Stripe). Once the payment clears, the transaction commits, and a 200 OK is sent back to React.

## Phase 5: The Graceful Fallback (React)
React receives the 409 Conflict response from the loser of the race. It must now handle the user experience without losing the rest of the sale.
- [ ] Intercept the Error: The React checkout function catches the 409 status code and reads the productId from the JSON response.Redirect to Cart: React immediately routes the user away from the checkout screen and back to the main Cart screen.
- [ ] Update the UI:React searches the cart state for the failed productId.It visually flags that specific item (e.g., red text saying "Sold out just now!").
- [ ] It disables the ability to buy that specific item and recalculates the cart total minus the sold-out item.
- [ ] Inform the User: A polite banner is displayed at the top: "Sorry, [Item Name] sold out while you were checking out. Your cart total has been updated.
- [ ]"Next Action: The user reviews the remaining items and the new total. They can click "Proceed to Checkout" again to successfully buy the rest of their items.

# checkout system

- [x] when customer click proceed checkout button they need to direct first page of checkout
- [x] there need to be order summary section , shipping address section
- [/] in the shipping address section customer need to be able to do select shipping address from existing list or need to provide entire new shipping address, (need to be contain fullname, phone number, email, address, district dropdown and delivery type)
- [x] the shipping will be change according to fast shipping or standard shipping
- [ ] customer need to be able to mark the shipping location from google maps too
- [x] use an open source map instead for developement
- [x] order summary section need to be shown calculated price after adding shipping price too.

- [x] then customer need to redirect to payemnet page in here customer can choose payment type. cash on delivery, card payment, bank transfer
- [/] Implement an "Order Pending" status for manual Bank Transfer verifications. --- not checked
- [ ] Integrate a third-party payment gateway drop-in UI instead of a custom card form. --- just custom ui
- [ ] if it is bank transfer customer need to submit valid receipt --- not checked
 
- [x] then customer can proceed the payment
- [x] customer will successful or unsuccess msg about the transaction
- [x] if successful '->   there is buttoN redirect customer to shop again
- [x]                     and customerr need to get success email with order summary
- [ ] if unsucessful ->   customer need to be informed gentley about error --- every order become successful not checked because of that
- [ ]                     he/she need to redirect the place where error occured*(if last item already sold redirect to cart, if card detail wrong redirect to payment)

- [/] use SMTP service for email notification --- just open source softwear not checked because of that 
- [ ] cloud space to upload images --- not yet
- [ ] map softwear --- open source softwear 
- [ ] payment gateway