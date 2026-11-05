package com.icrowd_api.features.question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
public interface QuestionRepository extends JpaRepository<ProductQuestion,Long> {
    Page<ProductQuestion> findByProduct_Id(Long productId,Pageable pageable);
    java.util.Optional<ProductQuestion> findByIdAndProduct_Id(Long id,Long productId);
}
