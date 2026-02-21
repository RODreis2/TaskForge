package com.Exemple.Event.repository;

import com.Exemple.Event.domain.TaskModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CreateTaskRepository extends JpaRepository<TaskModel, UUID> {
}
