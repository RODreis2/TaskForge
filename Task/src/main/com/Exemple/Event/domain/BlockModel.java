package com.Exemple.Event.domain;

import com.Exemple.Event.enums.BlockType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;

import java.time.LocalDateTime;
import java.util.UUID;


@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
public class BlockModel {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private TaskModel task;

    @Enumerated(EnumType.STRING)
    private BlockType type;

    private Integer orderIndex;

    @Column(columnDefinition = "TEXT")
    private String textContent;

    @Column(columnDefinition = "TEXT")
    private String drawingData;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
