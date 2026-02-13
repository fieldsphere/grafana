package build

import (
	"crypto/md5"
	"crypto/sha256"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
)

func logAndClose(c io.Closer) {
	if err := c.Close(); err != nil {
		slog.Error("Error closing stream", "error", err)
	}
}

func shaDir(dir string) error {
	return filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
		if path == dir {
			return nil
		}

		if strings.Contains(path, ".sha256") {
			return nil
		}
		if err := shaFile(path); err != nil {
			slog.Error("Failed to create sha file", "path", path, "error", err)
		}
		return nil
	})
}

func shaFile(file string) error {
	// Ignore gosec G304 as this function is only used in the build process.
	//nolint:gosec
	r, err := os.Open(file)
	if err != nil {
		return err
	}

	defer logAndClose(r)

	h := sha256.New()
	_, err = io.Copy(h, r)
	if err != nil {
		return err
	}

	// Ignore gosec G304 as this function is only used in the build process.
	//nolint:gosec
	out, err := os.Create(file + ".sha256")
	if err != nil {
		return err
	}

	_, err = fmt.Fprintf(out, "%x\n", h.Sum(nil))
	if err != nil {
		return err
	}

	return out.Close()
}

func md5File(file string) error {
	// Ignore gosec G304 as this function is only used in the build process.
	//nolint:gosec
	fd, err := os.Open(file)
	if err != nil {
		return err
	}
	defer logAndClose(fd)

	h := md5.New()
	_, err = io.Copy(h, fd)
	if err != nil {
		return err
	}

	// Ignore gosec G304 as this function is only used in the build process.
	//nolint:gosec
	out, err := os.Create(file + ".md5")
	if err != nil {
		return err
	}

	_, err = fmt.Fprintf(out, "%x\n", h.Sum(nil))
	if err != nil {
		return err
	}

	return out.Close()
}

// basically `rm -r`s the list of files provided
func rmr(paths ...string) {
	for _, path := range paths {
		slog.Info("Removing directory", "path", path)
		if err := os.RemoveAll(path); err != nil {
			slog.Error("Error deleting folder", "path", path, "error", err)
		}
	}
}
