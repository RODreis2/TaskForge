package com.Exemple.Event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class TaskTreeItemResponse {
    private UUID id;
    private String title;
    private String description;
    private UUID folderId;
    private LocalDateTime updatedAt;
}
