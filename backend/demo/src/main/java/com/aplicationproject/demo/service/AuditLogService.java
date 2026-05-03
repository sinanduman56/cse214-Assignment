package com.aplicationproject.demo.service;

import com.aplicationproject.demo.model.AuditLog;
import com.aplicationproject.demo.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String userEmail, String action, String details, String entityType, Long entityId) {
        AuditLog auditLog = new AuditLog(userEmail, action, details, entityType, entityId);
        auditLogRepository.save(auditLog);
    }

    public Page<AuditLog> getAuditLogs(int page, int size) {
        return auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
    }
}
