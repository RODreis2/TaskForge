package com.Event.User.controller;


import com.Event.User.config.TokenService;
import com.Event.User.config.JWTuserData;
import com.Event.User.domain.UserModel;
import com.Event.User.dto.request.UserRequest;
import com.Event.User.dto.response.UserResponse;
import com.Event.User.exceptions.UsernameOrPasswordInvalidException;
import com.Event.User.mapper.UserMapper;
import com.Event.User.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    @Value("${TaskForge.security.cookie-secure:false}")
    private boolean cookieSecure;


    @PostMapping("/create")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserRequest request){
        UserModel savedUser = userService.createUser(request);
        UserResponse response = userMapper.toResponse(savedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id){

        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody UserRequest userRequest) {

        try {
            UsernamePasswordAuthenticationToken userAndPass = new UsernamePasswordAuthenticationToken(userRequest.getEmail(), userRequest.getPassword());
            Authentication authenticate = authenticationManager.authenticate(userAndPass);

            UserModel user = (UserModel) authenticate.getPrincipal();

            String token = tokenService.generateToken(user);
            ResponseCookie cookie = buildSessionCookie(token, 24 * 60 * 60);
            UserResponse response = userMapper.toResponse(user);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);
        }catch (BadCredentialsException e){
            throw new UsernameOrPasswordInvalidException("Username or password incorrect");
        }
        }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = buildSessionCookie("", 0);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof JWTuserData jwtuserData)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserModel user = userService.getById(jwtuserData.id());
        UserResponse response = userMapper.toResponse(user);
        return ResponseEntity.ok(response);
    }

    private ResponseCookie buildSessionCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

}
