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
	fmt.Println(line)
	if _, err := io.WriteString(w, line); err != nil {
		slog.Error("Failed to write response", "error", err)
	}
}

func main() {
	http.HandleFunc("/", hello)
	if err := http.ListenAndServe(":3010", nil); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}
