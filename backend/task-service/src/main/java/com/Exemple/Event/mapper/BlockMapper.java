package com.Exemple.Event.mapper;

import com.Exemple.Event.domain.BlockModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.response.BlockResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BlockMapper {

    BlockModel toEntity(BlockRequest request);

    @Mapping(target = "taskId", source = "task.id")
    BlockResponse toResponse(BlockModel model);
}
