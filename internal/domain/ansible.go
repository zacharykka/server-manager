package domain

type AdhocCommand struct {
	Hosts  []string `json:"hosts"`
	Module string   `json:"module"`
	Args   string   `json:"args"`
}

type PlaybookCommand struct {
	Hosts     []string               `json:"hosts"`
	Playbook  string                 `json:"playbook"`
	ExtraVars map[string]interface{} `json:"extra_vars"`
}

type AdhocExecutor interface {
	ExecuteAdhoc(cmd *AdhocCommand) (string, error)
}

type PlaybookExecutor interface {
	ExecutePlaybook(cmd *PlaybookCommand) (string, error)
}
