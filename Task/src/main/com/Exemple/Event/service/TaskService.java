package com.Exemple.Event.service;


import com.Exemple.Event.domain.BlockModel;
import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.response.BlockResponse;
import com.Exemple.Event.enums.BlockType;
import com.Exemple.Event.mapper.BlockMapper;
import com.Exemple.Event.mapper.TaskMapper;
import com.Exemple.Event.repository.BlockRepository;
import com.Exemple.Event.repository.CreateTaskRepository;
import com.Exemple.Event.repository.TaskRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TaskService {

    private final CreateTaskRepository createTaskRepository;
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final BlockMapper blockMapper;
    private final BlockRepository blockRepository;

    public TaskModel createTask(TaskRequest request){
        TaskModel taskModel = taskMapper.toEntity(request);
        return taskModel;
    }

    public List<TaskModel> listTasks(){
        return taskRepository.findAll();
    }

    public BlockResponse addBlock(UUID taskId, BlockRequest request){

        TaskModel task = taskRepository.findById(taskId).orElseThrow(()-> new RuntimeException("Task Não encontrada"));

        BlockModel block = new BlockModel();
        block.setType(request.getType());
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

        return blockMapper.toResponse(saved);
    }
}
