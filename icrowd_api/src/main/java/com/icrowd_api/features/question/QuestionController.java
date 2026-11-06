package com.icrowd_api.features.question;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
@RestController @RequestMapping("/api/products/{productId}/questions")
public class QuestionController {
    private final QuestionService service;
    public QuestionController(QuestionService service) { this.service=service; }
    public record TextRequest(String text) {}
    @GetMapping public Object list(@PathVariable Long productId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size) { return service.list(productId,page,size); }
    @PostMapping public Object ask(@PathVariable Long productId,@RequestBody TextRequest request,Authentication auth) { return service.ask(productId,auth.getName(),request.text()); }
    @PutMapping("/{questionId}/answer") public Object answer(@PathVariable Long productId,@PathVariable Long questionId,@RequestBody TextRequest request,Authentication auth) { return service.answer(productId,questionId,auth.getName(),request.text()); }
    @DeleteMapping("/{questionId}") public org.springframework.http.ResponseEntity<Void> delete(@PathVariable Long productId,@PathVariable Long questionId,Authentication auth) { service.delete(productId,questionId,auth.getName());return org.springframework.http.ResponseEntity.noContent().build(); }
}
