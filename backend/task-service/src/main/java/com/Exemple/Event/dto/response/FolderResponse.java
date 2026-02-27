package com.Exemple.Event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class FolderResponse {
    private UUID id;
    private String name;
    private UUID parentId;
}
