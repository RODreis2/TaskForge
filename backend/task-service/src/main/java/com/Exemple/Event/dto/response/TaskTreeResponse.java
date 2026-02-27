package com.Exemple.Event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class TaskTreeResponse {
    private List<FolderResponse> folders;
    private List<TaskTreeItemResponse> tasks;
}
