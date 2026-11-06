package com.icrowd_api.features.question;
import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.review.ReviewService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
@Service @Transactional
public class QuestionService {
    private final QuestionRepository questions;
    private final ProductRepository products;
    private final UserRepository users;
    public QuestionService(QuestionRepository questions,ProductRepository products,UserRepository users) { this.questions=questions;this.products=products;this.users=users; }
    public record Response(Long id,Long userId,String authorName,String question,String answer,String answeredBy,java.time.LocalDateTime createdAt,java.time.LocalDateTime answeredAt) {}
    private String name(User u) { return u.getCustomer()!=null ? u.getCustomer().getFirstName() : (u.getAdmin()!=null ? u.getAdmin().getFirstName() : "Customer"); }
    private Response response(ProductQuestion q) { return new Response(q.getId(),q.getUser().getId(),name(q.getUser()),q.getQuestion(),q.getAnswer(),q.getAnsweredBy()==null?null:"Store staff",q.getCreatedAt(),q.getAnsweredAt()); }
    private User user(String email) { return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED,"Sign in required")); }
    private Product product(Long id) { return products.findByIdAndIsActiveTrue(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"Product not found")); }
    private ProductQuestion question(Long id,Long qid) { return questions.findByIdAndProduct_Id(qid,id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"Question not found")); }
    private String text(String text,int max) { if(text==null || text.trim().length()<5 || text.trim().length()>max) throw new ResponseStatusException(BAD_REQUEST,"Enter 5 to "+max+" characters"); return text.trim(); }
    public org.springframework.data.domain.Page<Response> list(Long id,int page,int size) { product(id);return questions.findByProduct_Id(id,ReviewService.page(page,size)).map(this::response); }
    public Response ask(Long id,String email,String text) { ProductQuestion q=new ProductQuestion();q.setProduct(product(id));q.setUser(user(email));q.setQuestion(text(text,1000));return response(questions.saveAndFlush(q)); }
    public Response answer(Long id,Long qid,String email,String text) { User u=user(email);if(!"ADMIN".equals(u.getRole())) throw new ResponseStatusException(FORBIDDEN,"Only store staff can answer questions");ProductQuestion q=question(id,qid);q.setAnswer(text(text,2000));q.setAnsweredBy(u);q.setAnsweredAt(java.time.LocalDateTime.now());return response(q); }
    public void delete(Long id,Long qid,String email) { User u=user(email);ProductQuestion q=question(id,qid);if(!u.getId().equals(q.getUser().getId())&&!"ADMIN".equals(u.getRole()))throw new ResponseStatusException(FORBIDDEN,"You can only delete your own question");questions.delete(q); }
}
