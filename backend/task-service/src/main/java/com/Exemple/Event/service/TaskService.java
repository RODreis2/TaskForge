package com.Exemple.Event.service;


import com.Exemple.Event.domain.BlockModel;
import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.response.BlockResponse;
import com.Exemple.Event.dto.response.TaskDetailResponse;
import com.Exemple.Event.dto.response.TaskSummaryResponse;
import com.Exemple.Event.enums.BlockType;
import com.Exemple.Event.mapper.TaskMapper;
import com.Exemple.Event.repository.BlockRepository;
import com.Exemple.Event.repository.TaskRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@AllArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final BlockRepository blockRepository;

    public TaskModel createTask(TaskRequest request){
        TaskModel taskModel = taskMapper.toEntity(request);
        return taskRepository.save(taskModel);
    }

    public List<TaskSummaryResponse> listTasks(){
        return taskRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    public TaskDetailResponse getTask(UUID taskId) {
        TaskModel task = taskRepository.findWithBlocksById(taskId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task não encontrada"));
        return toDetailResponse(task);
    }

    public BlockResponse addBlock(UUID taskId, BlockRequest request){

        TaskModel task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task não encontrada"));

        BlockModel block = new BlockModel();
        block.setType(request.getType());
        block.setOrderIndex(request.getOrderIndex());
        block.setCreatedAt(LocalDateTime.now());
        block.setUpdatedAt(LocalDateTime.now());

        block.setTask(task);

        if(request.getType() == BlockType.TEXT){
            block.setTextContent(request.getTextContent());
            block.setDrawingData(null);
        } else if (request.getType() == BlockType.DRAW) {
        block.setDrawingData(request.getDrawingData());
        block.setTextContent(null);
    }
        task.getBlocks().add(block);

        BlockModel saved = blockRepository.save(block);
        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);

        return toBlockResponse(saved);
    }

    private TaskSummaryResponse toSummaryResponse(TaskModel model) {
        return new TaskSummaryResponse(
                model.getId(),
                model.getTitle(),
                model.getDescription(),
                model.getUpdatedAt(),
                blockRepository.countByTaskId(model.getId())
        );
    }

    private TaskDetailResponse toDetailResponse(TaskModel model) {
        List<BlockResponse> blocks = model.getBlocks() == null ? List.of() : model.getBlocks()
                .stream()
                .map(this::toBlockResponse)
                .collect(Collectors.toList());

        return new TaskDetailResponse(
                model.getId(),
                model.getTitle(),
                model.getDescription(),
                model.getCreatedAt(),
                model.getUpdatedAt(),
                blocks
        );
    }

    private BlockResponse toBlockResponse(BlockModel model) {
        return new BlockResponse(
                model.getId(),
                model.getTask() != null ? model.getTask().getId() : null,
                model.getType(),
                model.getOrderIndex(),
                model.getTextContent(),
                model.getDrawingData(),
                model.getCreatedAt(),
                model.getUpdatedAt()
        );
    }
}
