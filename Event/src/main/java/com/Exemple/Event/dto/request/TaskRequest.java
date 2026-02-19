package com.Exemple.Event.dto.request;

import com.Exemple.Event.domain.BlockModel;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TaskRequest {

    private String title;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BlockModel> blocks = new ArrayList<>();
}
