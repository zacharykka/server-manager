package app

import (
	"context"
	"log"

	"github.com/apenella/go-ansible/v2/pkg/adhoc"
)

// ExecuteAdhoc executes an adhoc command
func ExecuteAdhoc(ansibleAdhocOptions *adhoc.AnsibleAdhocOptions) {
	err := adhoc.NewAnsibleAdhocExecute("all").
		WithAdhocOptions(ansibleAdhocOptions).
		Execute(context.TODO())
	if err != nil {
		log.Fatalf("Error executing adhoc: %v", err)
	}
}
