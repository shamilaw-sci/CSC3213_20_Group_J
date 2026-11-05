package com.icrowd_api.features.review;
import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.product.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
@Service
@Transactional
public class ReviewService {
    private final ReviewRepository reviews;
    private final ProductRepository products;
    private final UserRepository users;
    private final ReviewTitleGenerator titles;
    private final jakarta.persistence.EntityManager em;
    public ReviewService(ReviewRepository reviews, ProductRepository products, UserRepository users, ReviewTitleGenerator titles, jakarta.persistence.EntityManager em) {
        this.reviews=reviews; this.products=products; this.users=users; this.titles=titles; this.em=em;
    }
    public static Pageable page(int page, int size) {
        if (page < 0 || size < 1 || size > 50) throw new ResponseStatusException(BAD_REQUEST, "Invalid page (size must be 1 to 50)");
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
    }
    public User user(String email) { return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Sign in required")); }
    private Product lock(Long id) {
        Product p=products.findForCheckout(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        if (!Boolean.TRUE.equals(p.getIsActive())) throw new ResponseStatusException(NOT_FOUND, "Product not found");
        return p;
    }
    public Page<ReviewResponse> getProductReviews(Long id, int page, int size) {
        if (!products.existsById(id)) throw new ResponseStatusException(NOT_FOUND, "Product not found");
        return reviews.findByProduct_Id(id, page(page,size)).map(ReviewResponse::fromEntity);
    }
    public boolean purchased(Long productId, Long userId) {
        return em.createQuery("select count(i) from OrderItem i where i.product.id=:product and i.order.user.id=:user and i.order.status in (com.icrowd_api.features.order.OrderStatus.CONFIRMED, com.icrowd_api.features.order.OrderStatus.PROCESSING, com.icrowd_api.features.order.OrderStatus.COMPLETED)", Long.class)
            .setParameter("product",productId).setParameter("user",userId).getSingleResult()>0;
    }
    private void content(Review r, ReviewRequest request) {
        String comment=request.getComment()==null ? "" : request.getComment().trim();
        if (request.getRating()==null || request.getRating()<1 || request.getRating()>5 || comment.length()<5 || comment.length()>1000)
            throw new ResponseStatusException(BAD_REQUEST,"Choose 1 to 5 stars and enter 5 to 1000 characters");
        r.setRating(request.getRating()); r.setComment(comment); r.setTitle(titles.generateTitle(comment));
    }
    private void totals(Product p) {
        reviews.flush();
        p.setReviewCount(Math.toIntExact(reviews.countByProduct_Id(p.getId())));
        p.setAverageRating(reviews.average(p.getId())); products.save(p);
    }
    public ReviewResponse addReview(Long id,String email,ReviewRequest request) {
        Product p=lock(id); User u=user(email);
        if (reviews.existsByProduct_IdAndUser_Id(id,u.getId())) throw new ResponseStatusException(CONFLICT,"You already reviewed this product. Edit your existing review.");
        if (!purchased(id,u.getId())) throw new ResponseStatusException(FORBIDDEN,"You can review this product after your order is confirmed.");
        Review r=Review.builder().product(p).user(u).build(); content(r,request);
        reviews.saveAndFlush(r); totals(p); return ReviewResponse.fromEntity(r);
    }
    public ReviewResponse update(Long id,Long reviewId,String email,ReviewRequest request) {
        Product p=lock(id); Review r=reviews.findByIdAndProduct_Id(reviewId,id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"Review not found"));
        if (!r.getUser().getId().equals(user(email).getId())) throw new ResponseStatusException(FORBIDDEN,"You can only edit your own review");
        content(r,request); totals(p); return ReviewResponse.fromEntity(r);
    }
    public void delete(Long id,Long reviewId,String email) {
        Product p=lock(id); User u=user(email);
        Review r=reviews.findByIdAndProduct_Id(reviewId,id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"Review not found"));
        if (!r.getUser().getId().equals(u.getId()) && !"ADMIN".equals(u.getRole())) throw new ResponseStatusException(FORBIDDEN,"You can only delete your own review");
        reviews.delete(r); totals(p);
    }
    public java.util.List<ReviewResponse> mine(String email) {
        return reviews.findByUser_IdOrderByCreatedAtDesc(user(email).getId()).stream().map(ReviewResponse::fromEntity).toList();
    }
    public java.util.List<java.util.Map<String,Object>> pending(String email) {
        return em.createQuery("select distinct i.product from OrderItem i where i.order.user.id=:user and i.order.status in (com.icrowd_api.features.order.OrderStatus.CONFIRMED, com.icrowd_api.features.order.OrderStatus.PROCESSING, com.icrowd_api.features.order.OrderStatus.COMPLETED) and i.product.isActive=true and not exists (select r.id from Review r where r.product=i.product and r.user=i.order.user)",Product.class)
            .setParameter("user",user(email).getId()).getResultList().stream().map(p -> java.util.Map.<String,Object>of("id",p.getId(),"name",p.getName())).toList();
    }
}
