package com.Event.User.mapper;

import com.Event.User.domain.UserModel;
import com.Event.User.dto.request.UserRequest;
import com.Event.User.dto.response.UserResponse;
import lombok.experimental.UtilityClass;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserModel toEntity(UserRequest request);
    UserResponse toResponse(UserModel userModel);
}
