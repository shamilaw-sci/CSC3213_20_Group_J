package com.icrowd_api.features.marketing;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
public interface EmailQueueLockRepository extends JpaRepository<EmailQueueLock,Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select l from EmailQueueLock l where l.id = 1")
    EmailQueueLock acquire();
}
