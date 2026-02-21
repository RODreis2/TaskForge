package com.Event.User.controller;


import com.Event.User.domain.UserModel;
import com.Event.User.dto.request.UserRequest;
import com.Event.User.dto.response.UserResponse;
import com.Event.User.mapper.UserMapper;
import com.Event.User.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @PostMapping("/create")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserRequest request){
        UserModel savedUser = userService.createUser(request);
        UserResponse response = userMapper.toResponse(savedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    public ResponseEntity<String> deleteUser(@PathVariable UUID id){
        userService.deleteUser(id);

        return ResponseEntity.noContent().build();
    }
}

