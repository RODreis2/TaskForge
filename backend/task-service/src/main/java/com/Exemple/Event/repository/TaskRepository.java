package com.Exemple.Event.repository;

import com.Exemple.Event.domain.TaskModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskModel, UUID> {
    List<TaskModel> findAllByOrderByUpdatedAtDesc();
    @EntityGraph(attributePaths = "blocks")
    Optional<TaskModel> findWithBlocksById(UUID id);

}
