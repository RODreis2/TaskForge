package com.Exemple.Event.dto.response;

import com.Exemple.Event.domain.BlockModel;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TaskResponse {

    private UUID id;
    private String title;
    private String description;
    private List<BlockModel> blocks = new ArrayList<>();
}

