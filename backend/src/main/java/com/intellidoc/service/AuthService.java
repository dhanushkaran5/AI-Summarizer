package com.intellidoc.service;

import com.intellidoc.dto.AuthDto;
import com.intellidoc.entity.User;
import com.intellidoc.repository.UserRepository;
import com.intellidoc.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthDto.AuthResponse register(AuthDto.AuthRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }
        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()
                && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password confirmation does not match.");
        }
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("An account with this email address already exists.");
        }

        User user = User.builder()
                .name(request.getName() != null && !request.getName().isBlank() ? request.getName().trim() : "User")
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .build();

        user = userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());

        return AuthDto.AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .build();
    }

    public AuthDto.AuthResponse login(AuthDto.AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password credentials."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password credentials.");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());

        return AuthDto.AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .build();
    }

    public AuthDto.AuthResponse refreshToken(String token) {
        if (token == null || !tokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("Invalid or expired session token. Please re-authenticate.");
        }
        String email = tokenProvider.getEmailFromToken(token);
        User user = getUserByEmail(email);

        String newToken = tokenProvider.generateToken(user.getId(), user.getEmail());
        return AuthDto.AuthResponse.builder()
                .token(newToken)
                .user(mapToDto(user))
                .build();
    }

    public AuthDto.UserDto getCurrentUser(String email) {
        User user = getUserByEmail(email);
        return mapToDto(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private AuthDto.UserDto mapToDto(User user) {
        return AuthDto.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }
}
