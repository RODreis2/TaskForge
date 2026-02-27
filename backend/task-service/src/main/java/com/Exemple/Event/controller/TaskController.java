package com.Exemple.Event.controller;


import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.request.CreateFolderRequest;
import com.Exemple.Event.dto.request.MoveTaskRequest;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.request.TaskDocumentUpsertRequest;
import com.Exemple.Event.dto.response.BlockResponse;
import com.Exemple.Event.dto.response.FolderResponse;
import com.Exemple.Event.dto.response.TaskDocumentResponse;
import com.Exemple.Event.dto.response.TaskDetailResponse;
import com.Exemple.Event.dto.response.TaskResponse;
import com.Exemple.Event.dto.response.TaskSummaryResponse;
import com.Exemple.Event.dto.response.TaskTreeResponse;
import com.Exemple.Event.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/event")
@RequiredArgsConstructor
public class TaskController {

    private static final UUID DEFAULT_OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private final TaskService eventService;

    @PostMapping("/task")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request){
        TaskModel taskModel = eventService.createTask(request, DEFAULT_OWNER_ID);
        TaskResponse response = new TaskResponse(taskModel.getId(), taskModel.getTitle(), taskModel.getDescription());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);

    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskSummaryResponse>> listTasks() {
        return ResponseEntity.ok(eventService.listTasks(DEFAULT_OWNER_ID));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<TaskDetailResponse> getTask(@PathVariable UUID taskId) {
        return ResponseEntity.ok(eventService.getTask(DEFAULT_OWNER_ID, taskId));
    }

    @PostMapping("/{taskId}/blocks")
    public ResponseEntity<BlockResponse> addBlock(@PathVariable UUID taskId, @RequestBody BlockRequest request) {

        BlockResponse response = eventService.addBlock(DEFAULT_OWNER_ID, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/folders")
    public ResponseEntity<FolderResponse> createFolder(@RequestBody CreateFolderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createFolder(DEFAULT_OWNER_ID, request));
    }

    @GetMapping("/tree")
    public ResponseEntity<TaskTreeResponse> getTree() {
        return ResponseEntity.ok(eventService.getTree(DEFAULT_OWNER_ID));
    }

    @PatchMapping("/tasks/{taskId}/move")
    public ResponseEntity<TaskSummaryResponse> moveTask(@PathVariable UUID taskId, @RequestBody MoveTaskRequest request) {
        return ResponseEntity.ok(eventService.moveTask(DEFAULT_OWNER_ID, taskId, request));
    }

    @GetMapping("/tasks/{taskId}/document")
    public ResponseEntity<TaskDocumentResponse> getTaskDocument(@PathVariable UUID taskId) {
        return ResponseEntity.ok(eventService.getTaskDocument(DEFAULT_OWNER_ID, taskId));
    }

    @PutMapping("/tasks/{taskId}/document")
    public ResponseEntity<TaskDocumentResponse> putTaskDocument(
            @PathVariable UUID taskId,
            @RequestBody TaskDocumentUpsertRequest request
    ) {
        return ResponseEntity.ok(eventService.upsertTaskDocument(DEFAULT_OWNER_ID, taskId, request));
    }
}
