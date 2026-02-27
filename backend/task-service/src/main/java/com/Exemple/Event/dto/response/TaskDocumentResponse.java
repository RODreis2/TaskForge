package com.Exemple.Event.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class TaskDocumentResponse {
    private UUID taskId;
    private JsonNode content;
    private Long version;
    private LocalDateTime updatedAt;
}
