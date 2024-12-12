# Document

## 1. 接口

### 1.1 执行命令

ad-hoc 命令执行接口 需要传入主机(组), 模块名, 模块参数, 以及ansible参数

### 1.2 Playbook

该模块所需功能如下:

- playbooks 增删改查
- 执行playbook
  - 选择Inventory
  - 选择playbook
  - 选择tags(可选, 默认为all)
  - 添加额外参数

### 1.3 Inventory

- Inventory 增删改查 + 临时 Inventory


## 2. 数据库设计

表结构如下:

- Inventory
  - id
  - name
  - hosts
  - vars
  - groups
  - created_at
  - updated_at
- Playbook
  - id
  - name
  - tasks
  - created_at
  - updated_at
- Task
  - id
  - name
  - module
  - args
  - created_at
  - updated_at
