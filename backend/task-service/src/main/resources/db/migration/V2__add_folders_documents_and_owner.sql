ALTER TABLE tasks
    ADD COLUMN owner_id UUID,
    ADD COLUMN folder_id UUID NULL;

UPDATE tasks
SET owner_id = '00000000-0000-0000-0000-000000000000'
WHERE owner_id IS NULL;

ALTER TABLE tasks
    ALTER COLUMN owner_id SET NOT NULL;

CREATE TABLE folders (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_folder_parent
        FOREIGN KEY (parent_id)
            REFERENCES folders (id)
            ON DELETE CASCADE
);

ALTER TABLE tasks
    ADD CONSTRAINT fk_task_folder
        FOREIGN KEY (folder_id)
            REFERENCES folders (id)
            ON DELETE SET NULL;

CREATE UNIQUE INDEX ux_folders_owner_parent_name
    ON folders (owner_id, parent_id, name);

CREATE INDEX idx_tasks_owner_updated
    ON tasks (owner_id, updated_at DESC);

CREATE TABLE task_documents (
    task_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    content_json TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_task_document_task
        FOREIGN KEY (task_id)
            REFERENCES tasks (id)
            ON DELETE CASCADE
);

CREATE INDEX idx_task_documents_owner
    ON task_documents (owner_id);
