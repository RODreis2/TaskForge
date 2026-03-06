package com.Exemple.Event.repository;

import com.Exemple.Event.domain.FolderModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FolderRepository extends JpaRepository<FolderModel, UUID> {
    List<FolderModel> findAllByOwnerIdOrderByNameAsc(UUID ownerId);
    List<FolderModel> findAllByOwnerId(UUID ownerId);
    Optional<FolderModel> findByIdAndOwnerId(UUID id, UUID ownerId);
    @Query("select f.id from FolderModel f where f.ownerId = :ownerId and f.parent.id = :parentId")
    List<UUID> findIdsByOwnerIdAndParentId(@Param("ownerId") UUID ownerId, @Param("parentId") UUID parentId);
}
