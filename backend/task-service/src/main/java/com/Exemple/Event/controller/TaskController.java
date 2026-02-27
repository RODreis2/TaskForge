package com.Exemple.Event.controller;


import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.response.BlockResponse;
import com.Exemple.Event.dto.response.TaskDetailResponse;
import com.Exemple.Event.dto.response.TaskResponse;
import com.Exemple.Event.dto.response.TaskSummaryResponse;
import com.Exemple.Event.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/event")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService eventService;

    @PostMapping("/task")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request){
        TaskModel taskModel = eventService.createTask(request);
        TaskResponse response = new TaskResponse(taskModel.getId(), taskModel.getTitle(), taskModel.getDescription());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);

    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskSummaryResponse>> listTasks() {
        return ResponseEntity.ok(eventService.listTasks());
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<TaskDetailResponse> getTask(@PathVariable UUID taskId) {
        return ResponseEntity.ok(eventService.getTask(taskId));
    }

    @PostMapping("/{taskId}/blocks")
    public ResponseEntity<BlockResponse> addBlock(@PathVariable UUID taskId, @RequestBody BlockRequest request) {

        BlockResponse response = eventService.addBlock(taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
