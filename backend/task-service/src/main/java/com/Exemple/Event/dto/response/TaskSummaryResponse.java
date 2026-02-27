package com.Exemple.Event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskSummaryResponse {
    private UUID id;
    private String title;
    private String description;
    private LocalDateTime updatedAt;
    private int blockCount;
}
