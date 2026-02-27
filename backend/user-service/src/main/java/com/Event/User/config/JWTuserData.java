package com.Event.User.config;

import lombok.Builder;

import java.util.UUID;


@Builder
public record JWTuserData(UUID id, String name, String email) {
}
