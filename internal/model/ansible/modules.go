package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// JSONMap represents a generic JSON object
type JSONMap map[string]interface{}

// Value implements the driver.Valuer interface for JSONMap
func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan implements the sql.Scanner interface for JSONMap
func (m *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}
	return json.Unmarshal(value.([]byte), &m)
}

// StringArray represents an array of strings that can be stored in JSON
type StringArray []string

// Value implements the driver.Valuer interface for StringArray
func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

// Scan implements the sql.Scanner interface for StringArray
func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}
	return json.Unmarshal(value.([]byte), &a)
}

// TaskStatus represents the status of a task
type TaskStatus int

const (
	TaskStatusStarted     TaskStatus = 1
	TaskStatusSuccess     TaskStatus = 2
	TaskStatusFailed      TaskStatus = 3
	TaskStatusSkipped     TaskStatus = 4
	TaskStatusUnreachable TaskStatus = 5
	TaskStatusRunning     TaskStatus = 6
	TaskStatusCanceled    TaskStatus = 7
)

// BasicInventory represents the base model for hosts and host groups
type BasicInventory struct {
	ID        string  `gorm:"primaryKey;type:varchar(255)" json:"id"`
	Name      string  `gorm:"not null;type:varchar(255)" json:"name"`
	Variables JSONMap `gorm:"type:json" json:"variables"`
	Type      string  `gorm:"not null;type:varchar(50)" json:"type"` // "host" or "host_group"
}

// HostGroup represents a group of hosts
type HostGroup struct {
	BasicInventory
	Tags  StringArray `gorm:"type:json" json:"tags"`
	Hosts []Host      `gorm:"many2many:host_group_mappings;" json:"hosts"`
}

// Host represents a single host
type Host struct {
	BasicInventory
	IP         string      `gorm:"not null;type:varchar(255)" json:"ip"`
	HostGroups []HostGroup `gorm:"many2many:host_group_mappings;" json:"hostGroups"`
}

// Playbook represents an ansible playbook
type Playbook struct {
	ID          string `gorm:"primaryKey;type:varchar(255)" json:"id"`
	Name        string `gorm:"not null;type:varchar(255)" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Content     string `gorm:"type:text" json:"content"`
}

// AdhocTask represents an adhoc task
type AdhocTask struct {
	ID     string  `gorm:"primaryKey;type:varchar(255)" json:"id"`
	Module string  `gorm:"not null;type:varchar(255)" json:"module"`
	Args   JSONMap `gorm:"type:json" json:"args"`
	Hosts  []Host  `gorm:"many2many:task_host_mappings;" json:"hosts"`
}

// Task represents a task (either playbook or adhoc)
type Task struct {
	ID            string     `gorm:"primaryKey;type:varchar(255)" json:"id"`
	Type          string     `gorm:"not null;type:varchar(50)" json:"type"` // "adhoc" or "playbook"
	PlaybookID    *string    `gorm:"type:varchar(255)" json:"playbook_id,omitempty"`
	Playbook      *Playbook  `gorm:"foreignKey:PlaybookID" json:"playbook,omitempty"`
	AdhocID       *string    `gorm:"type:varchar(255)" json:"adhoc_id,omitempty"`
	AdhocTask     *AdhocTask `gorm:"foreignKey:AdhocID" json:"adhoc,omitempty"`
	Hosts         []Host     `gorm:"many2many:task_host_mappings;" json:"hosts"`
	Status        TaskStatus `gorm:"not null" json:"status"`
	StartTime     time.Time  `gorm:"type:timestamp" json:"start_time"`
	EndTime       time.Time  `gorm:"type:timestamp" json:"end_time"`
	UpdateTime    time.Time  `gorm:"type:timestamp" json:"update_time"`
	Duration      int        `json:"duration"`
	StdoutLog     string     `gorm:"type:text" json:"stdout_log"`
	StderrLog     string     `gorm:"type:text" json:"stderr_log"`
	StdoutLogFile string     `gorm:"type:varchar(255)" json:"stdout_log_file"`
	StderrLogFile string     `gorm:"type:varchar(255)" json:"stderr_log_file"`
}
