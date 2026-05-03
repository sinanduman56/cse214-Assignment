package com.aplicationproject.demo.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    // Header tanımları
    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader(HEADER);

        // Public endpoint kontrolü: Token yoksa veya "Bearer " ile başlamıyorsa filtreyi geç
        if (authHeader == null || !authHeader.startsWith(PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(PREFIX.length());

        try {
            // Token parsing
            Claims claims = jwtService.extractAllClaims(jwt);
            String username = claims.getSubject();

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Null safety: roles null gelirse boş liste oluştur
                List<String> roles = claims.get("roles", List.class);
                
                // Role mapping: "ADMIN" -> "ROLE_ADMIN" (Spring Security standardı)
                List<SimpleGrantedAuthority> authorities = (roles != null) 
                        ? roles.stream()
                           .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT)))
                               .collect(Collectors.toList())
                        : List.of();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        authorities
                );

                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.info("Kullanıcı başarıyla doğrulandı: {}", username);
            }
        } catch (Exception e) {
            // Production log seviyesi (WARN)
            log.warn("Geçersiz JWT teşebbüsü: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}