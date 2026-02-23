CREATE TABLE users (
    id uuid PRIMARY KEY,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL
);
