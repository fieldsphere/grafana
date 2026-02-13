package api

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	"github.com/BurntSushi/toml"

	"github.com/grafana/grafana/pkg/services/supportbundles"
)

func writeSupportBundlef(buf *bytes.Buffer, format string, args ...any) {
	buf.WriteString(fmt.Sprintf(format, args...))
}

func (s *Service) supportBundleCollector(context.Context) (*supportbundles.SupportItem, error) {
	bWriter := bytes.NewBuffer(nil)
	bWriter.WriteString("# LDAP information\n\n")

	ldapConfig := s.ldapService.Config()
	if ldapConfig != nil {
		bWriter.WriteString("## LDAP Status\n")

		ldapClient := s.ldapService.Client()

		ldapStatus, err := ldapClient.Ping()
		if err != nil {
			writeSupportBundlef(bWriter,
				"Unable to ping server\n Err: %s", err)
		}

		for _, server := range ldapStatus {
			writeSupportBundlef(bWriter, "\nHost: %s  \n", server.Host)
			writeSupportBundlef(bWriter, "Port: %d  \n", server.Port)
			writeSupportBundlef(bWriter, "Available: %v  \n", server.Available)
			if server.Error != nil {
				writeSupportBundlef(bWriter, "Error: %s\n", server.Error)
			}
		}

		bWriter.WriteString("\n## LDAP Common Configuration issues\n\n")
		bWriter.WriteString("- Checked for **Mismatched search attributes**\n\n")
		issue := false
		for _, server := range ldapConfig.Servers {
			server.BindPassword = "********" // censor password on config dump
			server.ClientKey = "********"    // censor client key on config dump
			server.ClientKeyValue = "********"

			if !strings.Contains(server.SearchFilter, server.Attr.Username) {
				writeSupportBundlef(bWriter,
					"Search filter does not match username attribute  \n"+
						"Server: %s  \n"+
						"Search filter: %s  \n"+
						"Username attribute: %s  \n",
					server.Host, server.SearchFilter, server.Attr.Username)
				issue = true
			}
		}
		if !issue {
			bWriter.WriteString("No issues found\n\n")
		}
	}

	bWriter.WriteString("## LDAP configuration\n\n")

	bWriter.WriteString("```toml\n")
	errM := toml.NewEncoder(bWriter).Encode(ldapConfig)
	if errM != nil {
		writeSupportBundlef(bWriter,
			"Unable to encode LDAP configuration  \n Err: %s", errM)
	}
	bWriter.WriteString("```\n\n")

	bWriter.WriteString("## Grafana LDAP configuration\n\n")

	bWriter.WriteString("```ini\n")

	writeSupportBundlef(bWriter, "enabled = %v\n", s.cfg.Enabled)
	writeSupportBundlef(bWriter, "config_file = %s\n", s.cfg.ConfigFilePath)
	writeSupportBundlef(bWriter, "allow_sign_up = %v\n", s.cfg.AllowSignUp)
	writeSupportBundlef(bWriter, "sync_cron = %s\n", s.cfg.SyncCron)
	writeSupportBundlef(bWriter, "active_sync_enabled = %v\n", s.cfg.ActiveSyncEnabled)
	writeSupportBundlef(bWriter, "skip_org_role_sync = %v\n", s.cfg.SkipOrgRoleSync)

	bWriter.WriteString("```\n\n")

	return &supportbundles.SupportItem{
		Filename:  "ldap.md",
		FileBytes: bWriter.Bytes(),
	}, nil
}
