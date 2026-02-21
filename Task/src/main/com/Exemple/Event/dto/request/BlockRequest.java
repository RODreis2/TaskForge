package com.Exemple.Event.dto.request;

import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.enums.BlockType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class BlockRequest {

    private TaskModel task;
    private BlockType type;
    private Integer orderIndex;
    private String textContent;
    private String drawingData;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
