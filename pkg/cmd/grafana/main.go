package main

import (
	"log/slog"
	"os"

	"github.com/urfave/cli/v2"

	gcli "github.com/grafana/grafana/pkg/cmd/grafana-cli/commands"
	"github.com/grafana/grafana/pkg/cmd/grafana-server/commands"
	_ "github.com/grafana/grafana/pkg/operators"
	"github.com/grafana/grafana/pkg/server"
	"github.com/grafana/grafana/pkg/services/apiserver/standalone"
)

// The following variables cannot be constants, since they can be overridden through the -X link flag
var version = "9.2.0"
var commit = gcli.DefaultCommitValue
var enterpriseCommit = gcli.DefaultCommitValue
var buildBranch = "main"
var buildstamp string

func main() {
	app := MainApp()

	if err := app.Run(os.Args); err != nil {
		slog.Error("Grafana command failed", "error", err)
		os.Exit(1)
	}

	os.Exit(0)
}

func MainApp() *cli.App {
	app := &cli.App{
		Name:  "grafana",
		Usage: "Grafana server and command line interface",
		Authors: []*cli.Author{
			{
				Name:  "Grafana Project",
				Email: "hello@grafana.com",
			},
		},
		Version: version,
		Commands: []*cli.Command{
			gcli.CLICommand(version),
			commands.ServerCommand(version, commit, enterpriseCommit, buildBranch, buildstamp),
		},
		CommandNotFound:      cmdNotFound,
		EnableBashCompletion: true,
	}

	// Set the global build info
	buildInfo := standalone.BuildInfo{
		Version:          version,
		Commit:           commit,
		EnterpriseCommit: enterpriseCommit,
		BuildBranch:      buildBranch,
		BuildStamp:       buildstamp,
	}
	commands.SetBuildInfo(buildInfo)

	// Add the enterprise command line to build an api server
	f, err := server.InitializeAPIServerFactory()
	if err == nil {
		cmd := f.GetCLICommand(buildInfo)
		if cmd != nil {
			app.Commands = append(app.Commands, cmd)
		}
	}

	return app
}

func cmdNotFound(c *cli.Context, command string) {
	slog.Error("Unknown command",
		"appName", c.App.Name,
		"command", command,
		"helpBinary", os.Args[0],
		"helpFlag", "--help")
	os.Exit(1)
}
