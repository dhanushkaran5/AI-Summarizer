package com.intellidoc.service;

import com.intellidoc.dto.AuthDto;
import com.intellidoc.entity.User;
import com.intellidoc.repository.UserRepository;
import com.intellidoc.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    public void testRegisterSuccess() {
        AuthDto.AuthRequest request = AuthDto.AuthRequest.builder()
                .name("Alice")
                .email("alice@example.com")
                .password("password123")
                .confirmPassword("password123")
                .build();

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .password("encodedPassword")
                .role("USER")
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(tokenProvider.generateToken(1L, "alice@example.com")).thenReturn("mock-jwt-token");

        AuthDto.AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("alice@example.com", response.getUser().getEmail());
    }

    @Test
    public void testRegisterPasswordMismatch() {
        AuthDto.AuthRequest request = AuthDto.AuthRequest.builder()
                .name("Bob")
                .email("bob@example.com")
                .password("password123")
                .confirmPassword("differentPassword")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("confirmation does not match"));
    }

    @Test
    public void testLoginSuccess() {
        AuthDto.AuthRequest request = AuthDto.AuthRequest.builder()
                .email("alice@example.com")
                .password("password123")
                .build();

        User user = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .password("encodedPassword")
                .role("USER")
                .build();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(tokenProvider.generateToken(1L, "alice@example.com")).thenReturn("mock-jwt-token");

        AuthDto.AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
    }
}
