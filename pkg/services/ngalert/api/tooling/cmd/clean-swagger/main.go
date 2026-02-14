package main

import (
	"encoding/json"
	"flag"
	"log/slog"
	"os"
	"strings"
)

const RefKey = "$ref"

func main() {
	var input, output string
	flag.StringVar(&input, "if", "", "input file")
	flag.StringVar(&output, "of", "", "output file")

	flag.Parse()

	if input == "" || output == "" {
		slog.Error("No file specified", "input", input, "output", output)
		os.Exit(1)
	}

	//nolint
	b, err := os.ReadFile(input)
	if err != nil {
		slog.Error("Failed to read input file", "inputFilePath", input, "error", err)
		os.Exit(1)
	}

	data := make(map[string]any)
	if err := json.Unmarshal(b, &data); err != nil {
		slog.Error("Failed to parse input JSON", "inputFilePath", input, "error", err)
		os.Exit(1)
	}

	info, ok := data["info"].(map[string]any)
	if info == nil {
		slog.Error("Expecting info field")
		os.Exit(1)
	}
	if !ok {
		slog.Error("Unable to turn info field into map")
		os.Exit(1)
	}

	if info["title"] == nil {
		info["title"] = "Unified Alerting API"
	}

	definitions, ok := data["definitions"]
	if !ok {
		slog.Error("No definitions in swagger input")
		os.Exit(1)
	}

	defs := definitions.(map[string]any)
	for k, v := range defs {
		vMap := v.(map[string]any)
		refKey, ok := vMap[RefKey]
		if !ok {
			continue
		}

		if strings.TrimPrefix(refKey.(string), "#/definitions/") == k {
			slog.Debug("Removing circular ref key", "referenceKey", refKey)
			delete(vMap, RefKey)
		}
	}

	paths, ok := data["paths"].(map[string]any)
	if !ok {
		slog.Error("No paths in swagger input")
		os.Exit(1)
	}

	for _, path := range paths {
		path, ok := path.(map[string]any)
		if !ok {
			slog.Error("Invalid path in swagger input")
			os.Exit(1)
		}

		for _, op := range path {
			op, ok := op.(map[string]any)
			if !ok {
				continue
			}

			tags, ok := op["tags"].([]any)
			if !ok {
				slog.Debug("Invalid operation tags, skipping")
				continue
			}

			// Remove "stable" tag. Multiple tags cause routes to render strangely in the final docs.
			for i, tag := range tags {
				if tag == "stable" {
					slog.Debug("Removing stable tag from operation")
					op["tags"] = append(tags[:i], tags[i+1:]...)
				}
			}
		}
	}

	out, err := json.MarshalIndent(data, "", " ")
	if err != nil {
		slog.Error("Failed to marshal cleaned swagger JSON", "error", err)
		os.Exit(1)
	}

	err = os.WriteFile(output, out, 0644)
	if err != nil {
		slog.Error("Failed to write cleaned swagger file", "outputFilePath", output, "error", err)
		os.Exit(1)
	}
}
