package com.Exemple.Event.mapper;


import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.response.TaskResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "folder", ignore = true)
    @Mapping(target = "ownerId", ignore = true)
    TaskModel toEntity(TaskRequest request);
    TaskResponse toResponse(TaskModel model);

}
