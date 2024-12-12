-- Basic inventory table (base table for hosts and host groups)
CREATE TABLE basic_inventory (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    variables JSON,
    type VARCHAR(50) NOT NULL -- discriminator field to identify host vs host_group
);

-- Host groups table
CREATE TABLE host_groups (
    id VARCHAR(255) PRIMARY KEY REFERENCES basic_inventory(id),
    tags JSON -- Array of strings stored as JSON
);

-- Hosts table
CREATE TABLE hosts (
    id VARCHAR(255) PRIMARY KEY REFERENCES basic_inventory(id),
    ip VARCHAR(255) NOT NULL
);

-- Host to host group mapping (many-to-many relationship)
CREATE TABLE host_group_mappings (
    host_id VARCHAR(255) REFERENCES hosts(id),
    group_id VARCHAR(255) REFERENCES host_groups(id),
    PRIMARY KEY (host_id, group_id)
);

-- Playbooks table
CREATE TABLE playbooks (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT
);

-- Adhoc tasks table
CREATE TABLE adhoc_tasks (
    id VARCHAR(255) PRIMARY KEY,
    module VARCHAR(255) NOT NULL,
    args JSON
);

-- Tasks table
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'adhoc' or 'playbook'
    playbook_id VARCHAR(255) REFERENCES playbooks(id),
    adhoc_id VARCHAR(255) REFERENCES adhoc_tasks(id),
    status INTEGER NOT NULL, -- maps to TaskStatus enum (1-7)
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    update_time TIMESTAMP,
    duration INTEGER,
    stdout_log TEXT,
    stderr_log TEXT,
    stdout_log_file VARCHAR(255),
    stderr_log_file VARCHAR(255)
);

-- Task to host mapping (many-to-many relationship)
CREATE TABLE task_host_mappings (
    task_id VARCHAR(255) REFERENCES tasks(id),
    host_id VARCHAR(255) REFERENCES hosts(id),
    PRIMARY KEY (task_id, host_id)
);