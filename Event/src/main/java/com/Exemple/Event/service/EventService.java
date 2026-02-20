package com.Exemple.Event.service;


import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.CreateTaskRequest;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.mapper.TaskMapper;
import com.Exemple.Event.repository.CreateTaskRepository;
import com.Exemple.Event.repository.TaskRepository;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class EventService {

    private final CreateTaskRepository createTaskRepository;
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;

    public TaskModel createTask(TaskRequest request){
        TaskModel taskModel = taskMapper.toEntity(request);
        return taskModel;
    }

    public List<TaskModel> listTasks(){
        return taskRepository.findAll();
    }


}
