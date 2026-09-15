package com.intellidoc.repository;

import com.intellidoc.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    List<Workspace> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
