package com.Exemple.Event.repository;

import com.Exemple.Event.domain.FolderModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FolderRepository extends JpaRepository<FolderModel, UUID> {
    List<FolderModel> findAllByOwnerIdOrderByNameAsc(UUID ownerId);
}
