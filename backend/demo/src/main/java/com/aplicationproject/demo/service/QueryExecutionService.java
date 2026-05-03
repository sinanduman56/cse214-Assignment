package com.aplicationproject.demo.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueryExecutionService {

    private final EntityManager entityManager;

    private static final Set<String> BLOCKED_KEYWORDS = Set.of(
            "DROP", "DELETE", "TRUNCATE", "ALTER", "INSERT", "UPDATE", "CREATE", "GRANT", "REVOKE",
            // AV-03: UNION-based exfiltration ve multi-statement injection
            "UNION", "INFORMATION_SCHEMA", "PG_CATALOG", "PG_TABLES", "PG_CLASS",
            "SLEEP(", "PG_SLEEP", "WAITFOR", "BENCHMARK(",
            "INTO OUTFILE", "LOAD_FILE", "EXEC(", "EXECUTE(",
            "COPY ", "\\COPY"
    );

    /**
     * Executes a SELECT-only SQL query safely.
     * Blocks any DML/DDL operations and injection attempts for security.
     */
    public List<Map<String, Object>> executeQuery(String sql) {
        // Security: Only allow SELECT queries
        String upperSql = sql.trim().toUpperCase();
        if (!upperSql.startsWith("SELECT")) {
            throw new SecurityException("Sadece SELECT sorguları çalıştırılabilir.");
        }

        // AV-03: Block multi-statement injection (semicolon separation)
        if (upperSql.contains(";")) {
            throw new SecurityException("Güvenlik ihlali: Çoklu SQL ifadesi kullanılamaz.");
        }

        for (String blocked : BLOCKED_KEYWORDS) {
            if (upperSql.contains(blocked)) {
                throw new SecurityException("Güvenlik ihlali: '" + blocked + "' komutu kullanılamaz.");
            }
        }

        try {
            Query query = entityManager.createNativeQuery(sql);
            query.setMaxResults(1000); // Limit results for safety

            @SuppressWarnings("unchecked")
            List<Object[]> results = query.getResultList();

            // Convert results to List<Map>
            List<Map<String, Object>> mappedResults = new ArrayList<>();
            if (!results.isEmpty()) {
                // Get column names from the query
                var sessionFactory = entityManager.getEntityManagerFactory();
                for (Object row : results) {
                    Map<String, Object> rowMap = new LinkedHashMap<>();
                    if (row instanceof Object[] cols) {
                        for (int i = 0; i < cols.length; i++) {
                            rowMap.put("col_" + i, cols[i]);
                        }
                    } else {
                        rowMap.put("col_0", row);
                    }
                    mappedResults.add(rowMap);
                }
            }

            return mappedResults;
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            log.error("SQL execution error: {}", e.getMessage());
            throw new RuntimeException("Sorgu çalıştırılırken hata oluştu: " + e.getMessage());
        }
    }
}
