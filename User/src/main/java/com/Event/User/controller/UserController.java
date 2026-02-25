package com.Event.User.controller;


import com.Event.User.config.TokenService;
import com.Event.User.domain.UserModel;
import com.Event.User.dto.request.UserRequest;
import com.Event.User.dto.response.LoginResponse;
import com.Event.User.dto.response.UserResponse;
import com.Event.User.exceptions.UsernameOrPasswordInvalidException;
import com.Event.User.mapper.UserMapper;
import com.Event.User.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;


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
    public ResponseEntity<LoginResponse> login(@RequestBody UserRequest userRequest) {

        try {
            UsernamePasswordAuthenticationToken userAndPass = new UsernamePasswordAuthenticationToken(userRequest.getEmail(), userRequest.getPassword());
            Authentication authenticate = authenticationManager.authenticate(userAndPass);

            UserModel user = (UserModel) authenticate.getPrincipal();

            String token = tokenService.generateToken(user);

            return ResponseEntity.ok(new LoginResponse(token));
        }catch (BadCredentialsException e){
            throw new UsernameOrPasswordInvalidException("Username or password incorrect");
        }
        }

    }


