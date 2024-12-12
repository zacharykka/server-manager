package domain

type Host struct {
	ID         uint   `json:"id"`
	Hostname   string `json:"hostname"`
	IPAddress  string `json:"ip_address"`
	SSHUser    string `json:"ssh_user"`
	SSHKeyPath string `json:"ssh_key_path"`
}

type HostRepository interface {
	GetByIDs(ids []uint) ([]Host, error)
}
