package com.Exemple.Event.controller;


import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.response.BlockResponse;
import com.Exemple.Event.dto.response.TaskResponse;
import com.Exemple.Event.mapper.TaskMapper;
import com.Exemple.Event.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.UUID;

@Controller
@RequestMapping("/event")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService eventService;
    private final TaskMapper taskMapper;

    @PostMapping("/task")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request){
        TaskModel taskModel = eventService.createTask(request);
        TaskResponse response = taskMapper.toResponse(taskModel);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);

    }

    @PostMapping("/{taskId}/blocks")
    public ResponseEntity<BlockResponse> addBlock(@PathVariable UUID taskId, @RequestBody BlockRequest request) {

        BlockResponse response = eventService.addBlock(taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
