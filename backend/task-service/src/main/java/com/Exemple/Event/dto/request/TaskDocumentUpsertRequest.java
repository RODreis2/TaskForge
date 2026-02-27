package com.Exemple.Event.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class TaskDocumentUpsertRequest {
    private JsonNode content;
    private Long version;
}
