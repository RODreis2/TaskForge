package com.Exemple.Event.service;


import com.Exemple.Event.domain.BlockModel;
import com.Exemple.Event.domain.FolderModel;
import com.Exemple.Event.domain.TaskDocumentModel;
import com.Exemple.Event.domain.TaskModel;
import com.Exemple.Event.dto.request.BlockRequest;
import com.Exemple.Event.dto.request.CreateFolderRequest;
import com.Exemple.Event.dto.request.MoveTaskRequest;
import com.Exemple.Event.dto.request.TaskRequest;
import com.Exemple.Event.dto.request.TaskDocumentUpsertRequest;
import com.Exemple.Event.dto.response.BlockResponse;
import com.Exemple.Event.dto.response.FolderResponse;
import com.Exemple.Event.dto.response.TaskDocumentResponse;
import com.Exemple.Event.dto.response.TaskDetailResponse;
import com.Exemple.Event.dto.response.TaskSummaryResponse;
import com.Exemple.Event.dto.response.TaskTreeItemResponse;
import com.Exemple.Event.dto.response.TaskTreeResponse;
import com.Exemple.Event.enums.BlockType;
import com.Exemple.Event.mapper.TaskMapper;
import com.Exemple.Event.repository.BlockRepository;
import com.Exemple.Event.repository.FolderRepository;
import com.Exemple.Event.repository.TaskDocumentRepository;
import com.Exemple.Event.repository.TaskRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final BlockRepository blockRepository;
    private final FolderRepository folderRepository;
    private final TaskDocumentRepository taskDocumentRepository;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public TaskModel createTask(TaskRequest request, UUID ownerId){
        TaskModel taskModel = taskMapper.toEntity(request);
        taskModel.setOwnerId(ownerId);
        taskModel.setFolder(resolveFolder(ownerId, request.getFolderId()));
        return taskRepository.save(taskModel);
    }

    public List<TaskSummaryResponse> listTasks(UUID ownerId){
        return taskRepository.findAllByOwnerIdOrderByUpdatedAtDesc(ownerId).stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    public TaskDetailResponse getTask(UUID ownerId, UUID taskId) {
        TaskModel task = taskRepository.findWithBlocksByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task não encontrada"));
        return toDetailResponse(task);
    }

    public BlockResponse addBlock(UUID ownerId, UUID taskId, BlockRequest request){

        TaskModel task = taskRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task não encontrada"));

        BlockModel block = new BlockModel();
        block.setType(request.getType());
        block.setOrderIndex(request.getOrderIndex());
        block.setCreatedAt(LocalDateTime.now());
        block.setUpdatedAt(LocalDateTime.now());

        block.setTask(task);

        if(request.getType() == BlockType.TEXT){
            block.setTextContent(request.getTextContent());
            block.setDrawingData(null);
        } else if (request.getType() == BlockType.DRAW) {
        block.setDrawingData(request.getDrawingData());
        block.setTextContent(null);
    }
        task.getBlocks().add(block);

        BlockModel saved = blockRepository.save(block);
        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);

        return toBlockResponse(saved);
    }

    public FolderResponse createFolder(UUID ownerId, CreateFolderRequest request) {
        FolderModel parent = resolveFolder(ownerId, request.getParentId());

        FolderModel folder = FolderModel.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .parent(parent)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        FolderModel saved = folderRepository.save(folder);
        return new FolderResponse(saved.getId(), saved.getName(), saved.getParent() != null ? saved.getParent().getId() : null);
    }

    public TaskSummaryResponse moveTask(UUID ownerId, UUID taskId, MoveTaskRequest request) {
        TaskModel task = taskRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task não encontrada"));
        task.setFolder(resolveFolder(ownerId, request.getFolderId()));
        task.setUpdatedAt(LocalDateTime.now());
        return toSummaryResponse(taskRepository.save(task));
    }

    public TaskTreeResponse getTree(UUID ownerId) {
        List<FolderResponse> folders = folderRepository.findAllByOwnerIdOrderByNameAsc(ownerId).stream()
                .map(folder -> new FolderResponse(
                        folder.getId(),
                        folder.getName(),
                        folder.getParent() != null ? folder.getParent().getId() : null
                ))
                .toList();

        List<TaskTreeItemResponse> tasks = taskRepository.findAllByOwnerIdOrderByUpdatedAtDesc(ownerId).stream()
                .map(task -> new TaskTreeItemResponse(
                        task.getId(),
                        task.getTitle(),
                        task.getDescription(),
                        task.getFolder() != null ? task.getFolder().getId() : null,
                        task.getUpdatedAt()
                ))
                .toList();

        return new TaskTreeResponse(folders, tasks);
    }

    public TaskDocumentResponse getTaskDocument(UUID ownerId, UUID taskId) {
        TaskModel task = taskRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task não encontrada"));

        TaskDocumentModel existing = taskDocumentRepository.findByTaskIdAndOwnerId(taskId, ownerId)
                .orElseGet(() -> createLegacyDocument(ownerId, task));

        return toDocumentResponse(existing);
    }

    public TaskDocumentResponse upsertTaskDocument(UUID ownerId, UUID taskId, TaskDocumentUpsertRequest request) {
        TaskModel task = taskRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task não encontrada"));

        TaskDocumentModel document = taskDocumentRepository.findByTaskIdAndOwnerId(taskId, ownerId)
                .orElseGet(() -> createLegacyDocument(ownerId, task));

        Long incomingVersion = request.getVersion();
        if (incomingVersion != null && !incomingVersion.equals(document.getVersion())) {
            throw new ResponseStatusException(CONFLICT, "Documento desatualizado; recarregue e tente novamente");
        }

        JsonNode content = request.getContent() == null ? defaultDocumentContent() : request.getContent();
        document.setContentJson(content.toString());
        document.setVersion(document.getVersion() + 1);
        document.setUpdatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);

        return toDocumentResponse(taskDocumentRepository.save(document));
    }

    private FolderModel resolveFolder(UUID ownerId, UUID folderId) {
        if (folderId == null) {
            return null;
        }

        FolderModel folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Pasta não encontrada"));

        if (!ownerId.equals(folder.getOwnerId())) {
            throw new ResponseStatusException(NOT_FOUND, "Pasta não encontrada");
        }

        return folder;
    }

    private TaskDocumentModel createLegacyDocument(UUID ownerId, TaskModel task) {
        JsonNode defaultContent = defaultDocumentContent();

        TaskDocumentModel document = TaskDocumentModel.builder()
                .task(task)
                .ownerId(ownerId)
                .contentJson(defaultContent.toString())
                .version(0L)
                .updatedAt(LocalDateTime.now())
                .build();

        return taskDocumentRepository.save(document);
    }

    private JsonNode defaultDocumentContent() {
        return OBJECT_MAPPER.createObjectNode()
                .put("text", "")
                .set("drawing", OBJECT_MAPPER.createObjectNode().putArray("strokes"));
    }

    private TaskDocumentResponse toDocumentResponse(TaskDocumentModel model) {
        try {
            return new TaskDocumentResponse(
                    model.getTaskId(),
                    OBJECT_MAPPER.readTree(model.getContentJson()),
                    model.getVersion(),
                    model.getUpdatedAt()
            );
        } catch (Exception e) {
            throw new IllegalStateException("Conteúdo do documento inválido", e);
        }
    }

    private TaskSummaryResponse toSummaryResponse(TaskModel model) {
        return new TaskSummaryResponse(
                model.getId(),
                model.getTitle(),
                model.getDescription(),
                model.getFolder() != null ? model.getFolder().getId() : null,
                model.getUpdatedAt(),
                blockRepository.countByTaskId(model.getId())
        );
    }

    private TaskDetailResponse toDetailResponse(TaskModel model) {
        List<BlockResponse> blocks = model.getBlocks() == null ? List.of() : model.getBlocks()
                .stream()
                .map(this::toBlockResponse)
                .collect(Collectors.toList());

        return new TaskDetailResponse(
                model.getId(),
                model.getTitle(),
                model.getDescription(),
                model.getFolder() != null ? model.getFolder().getId() : null,
                model.getCreatedAt(),
                model.getUpdatedAt(),
                blocks
        );
    }

    private BlockResponse toBlockResponse(BlockModel model) {
        return new BlockResponse(
                model.getId(),
                model.getTask() != null ? model.getTask().getId() : null,
                model.getType(),
                model.getOrderIndex(),
                model.getTextContent(),
                model.getDrawingData(),
                model.getCreatedAt(),
                model.getUpdatedAt()
        );
    }
}
