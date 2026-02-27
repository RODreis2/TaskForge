package com.Exemple.Event.repository;

import com.Exemple.Event.domain.BlockModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BlockRepository extends JpaRepository<BlockModel, UUID> {
    int countByTaskId(UUID taskId);
}
