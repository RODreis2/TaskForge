CREATE TABLE tasks (
   id UUID PRIMARY KEY,
   title VARCHAR(255),
   description TEXT,
   created_at TIMESTAMP,
   updated_at TIMESTAMP
);

CREATE TABLE blocks (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    type VARCHAR(20),
    order_index INTEGER,
    text_content TEXT,
    drawing_data TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_task
    FOREIGN KEY(task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE
);