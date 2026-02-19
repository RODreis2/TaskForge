package com.Exemple.Event.mapper;


import ch.qos.logback.core.model.ComponentModel;
import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.response.TaskResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "string")
public interface TaskMapper {

    TaskModel toEntity(TaskRequest request);
    TaskResponse toResponse(TaskModel model);

}
