package com.icrowd_api.features.audit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit-logs")
@CrossOrigin(origins = {"http://localhost:5173", "${cors.allowed.origins:http://localhost:5173}"})
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String entityType) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

        Page<AuditLog> logs;
        if (entityType != null && !entityType.isBlank()) {
            logs = auditService.getAuditLogsByEntityType(entityType.toUpperCase(), pageRequest);
        } else {
            logs = auditService.getAuditLogs(pageRequest);
        }

        return ResponseEntity.ok(logs);
    }
}
