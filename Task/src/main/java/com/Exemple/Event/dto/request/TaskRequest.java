package com.Exemple.Event.dto.request;

import com.Exemple.Event.domain.BlockModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@NoArgsConstructor
@AllArgsConstructor
@Data
public class TaskRequest {

    private String title;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BlockModel> blocks = new ArrayList<>();
}
