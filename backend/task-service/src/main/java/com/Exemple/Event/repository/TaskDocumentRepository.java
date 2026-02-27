package com.Exemple.Event.repository;

import com.Exemple.Event.domain.TaskDocumentModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TaskDocumentRepository extends JpaRepository<TaskDocumentModel, UUID> {
    Optional<TaskDocumentModel> findByTaskIdAndOwnerId(UUID taskId, UUID ownerId);
}
