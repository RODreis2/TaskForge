package com.Exemple.Event.dto.response;

import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.enums.BlockType;
import jakarta.persistence.*;

import java.util.UUID;

public class BlockResponse {
    private UUID id;
    private TaskModel task;
    private BlockType type;
    private Integer orderIndex;
    private String textContent;
    private String drawingData;
}
