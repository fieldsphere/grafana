package main

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
)

func hello(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return
	}

	safeBody := strings.ReplaceAll(string(body), "\n", "")
	line := fmt.Sprintf("webbhook: -> %s", safeBody)
	slog.Info("Received webhook request", "requestBody", safeBody)
	if _, err := io.WriteString(w, line); err != nil {
		slog.Error("Failed to write webhook response", "error", err)
	}
}

func main() {
	http.HandleFunc("/", hello)
	if err := http.ListenAndServe(":3010", nil); err != nil {
		slog.Error("Alert webhook listener failed", "error", err)
		os.Exit(1)
	}
}
