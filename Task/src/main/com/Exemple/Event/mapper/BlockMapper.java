package com.Exemple.Event.mapper;

import com.Exemple.Event.domain.BlockModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.response.BlockResponse;

public interface BlockMapper {

    BlockModel toEntity(BlockRequest request);
    BlockResponse toResponse(BlockModel model);
}
