//go:build ignore
// +build ignore

//go:generate go run gen.go

package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/grafana/codejen"
	corecodegen "github.com/grafana/grafana/pkg/codegen"
	"github.com/grafana/grafana/pkg/plugins/codegen"
	"github.com/grafana/grafana/pkg/plugins/codegen/pfs"
)

var skipPlugins = map[string]bool{
	"influxdb": true, // plugin.json fails validation (defaultMatchFormat)
	"mixed":    true, // plugin.json fails validation (mixed)
	"opentsdb": true, // plugin.json fails validation (defaultMatchFormat)
}

const sep = string(filepath.Separator)

func main() {
	if len(os.Args) > 1 {
		slog.Error("Plugin thema code generator does not accept arguments", "commandArgs", os.Args)
		os.Exit(1)
	}

	cwd, err := os.Getwd()
	if err != nil {
		slog.Error("Could not get working directory", "error", err)
		os.Exit(1)
	}
	groot := filepath.Clean(filepath.Join(cwd, "../../.."))

	pluginKindGen := codejen.JennyListWithNamer(func(d *pfs.PluginDecl) string {
		return d.PluginMeta.Id
	})

	pluginKindGen.Append(
		&codegen.PluginRegistryJenny{},
		codegen.PluginGoTypesJenny("pkg/tsdb"),
		codegen.PluginTSTypesJenny("public/app/plugins"),
	)

	pluginKindGen.AddPostprocessors(
		corecodegen.PluginsSlashHeaderMapper("public/app/plugins/gen.go", filepath.Join("public", "app", "plugins")),
		corecodegen.GoFormat(),
		splitSchiffer(),
	)

	declParser := pfs.NewDeclParser(skipPlugins)
	decls, err := declParser.Parse(os.DirFS(cwd))
	if err != nil {
		slog.Error("Parsing plugins in directory failed", "directoryPath", cwd, "error", err)
		os.Exit(1)
	}

	jfs, err := pluginKindGen.GenerateFS(decls...)
	if err != nil {
		slog.Error("Error generating files", "error", err)
		os.Exit(1)
	}

	if _, set := os.LookupEnv("CODEGEN_VERIFY"); set {
		if err = jfs.Verify(context.Background(), groot); err != nil {
			slog.Error("Generated code is out of sync with inputs", "error", err, "hint", "run `make gen-cue` to regenerate")
			os.Exit(1)
		}
	} else if err = jfs.Write(context.Background(), groot); err != nil {
		slog.Error("Error while writing generated code to disk", "error", err)
		os.Exit(1)
	}
}

func splitSchiffer() codejen.FileMapper {
	names := []string{"panelcfg", "dataquery"}
	return func(f codejen.File) (codejen.File, error) {
		// TODO it's terrible that this has to exist, CODEJEN NEEDS TO BE BETTER
		path := filepath.ToSlash(f.RelativePath)
		for _, name := range names {
			if idx := strings.Index(path, name); idx != -1 {
				f.RelativePath = fmt.Sprintf("%s/%s", path[:idx], path[idx:])
				break
			}
		}
		return f, nil
	}
}
