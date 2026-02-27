package com.Exemple.Event.domain;

import com.Exemple.Event.enums.BlockType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;


@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "blocks")
public class BlockModel {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private TaskModel task;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private BlockType type;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "drawing_data", columnDefinition = "TEXT")
    private String drawingData;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
