package codegen

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
)

type PackageJSON struct {
	Version string `json:"version"`
}

// Opens the package.json file in the provided directory and returns a struct that represents its contents
func OpenPackageJSON(dir string) (PackageJSON, error) {
	f, err := os.Open(filepath.Clean(dir + "/package.json"))
	if err != nil {
		return PackageJSON{}, err
	}

	defer func() {
		if err := f.Close(); err != nil {
			slog.Error("Error closing package.json", "error", err)
		}
	}()

	jsonObj := PackageJSON{}
	if err := json.NewDecoder(f).Decode(&jsonObj); err != nil {
		return PackageJSON{}, err
	}

	return jsonObj, nil
}
