package com.aplicationproject.demo.service;

import com.aplicationproject.demo.config.JwtService;
import com.aplicationproject.demo.dto.AuthResponse;
import com.aplicationproject.demo.dto.LoginRequest;
import com.aplicationproject.demo.dto.RegisterRequest;
import com.aplicationproject.demo.model.User;
import com.aplicationproject.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Bu email adresi zaten kayıtlı: " + request.getEmail());
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRoleType(request.getRoleType().toLowerCase());
        user.setGender(request.getGender());

        user = userRepository.save(user);

        String token = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponse(token, refreshToken, user.getEmail(), user.getRoleType(), user.getId());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (!user.isActive()) {
            throw new org.springframework.security.authentication.DisabledException("Bu hesap askıya alınmıştır. Lütfen yönetici ile iletişime geçin.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponse(token, refreshToken, user.getEmail(), user.getRoleType(), user.getId());
    }

    public AuthResponse refreshToken(String refreshToken) {
        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new RuntimeException("Geçersiz refresh token");
        }

        String newToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponse(newToken, newRefreshToken, user.getEmail(), user.getRoleType(), user.getId());
    }
}
