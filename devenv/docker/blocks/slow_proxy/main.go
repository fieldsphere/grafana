package main

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"
)

func main() {
	origin := os.Getenv("ORIGIN_SERVER")
	if origin == "" {
		// it is never not-set, the default is in the `.env` file
		slog.Error("Missing required environment variable", "name", "ORIGIN_SERVER")
		os.Exit(1)
	}

	sleepDurationStr := os.Getenv("SLEEP_DURATION")
	if sleepDurationStr == "" {
		// it is never not-set, the default is in the `.env` file
		slog.Error("Missing required environment variable", "name", "SLEEP_DURATION")
		os.Exit(1)
	}

	sleep, err := time.ParseDuration(sleepDurationStr)
	if err != nil {
		slog.Error("Failed to parse SLEEP_DURATION", "value", sleepDurationStr, "error", err)
		os.Exit(1)
	}

	originURL, _ := url.Parse(origin)
	proxy := httputil.NewSingleHostReverseProxy(originURL)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		safeSleep := strings.ReplaceAll(sleep.String(), "\n", "")
		safeRequestUri := strings.ReplaceAll(r.RequestURI, "\n", "")
		slog.Info("Sleeping before proxying request", "sleepDuration", safeSleep, "requestURI", safeRequestUri)

		// This is commented out as CodeQL flags this as vulnerability CWE-117 (https://cwe.mitre.org/data/definitions/117.html)
		// If you need to debug and log the headers then use the line below instead of the structured log statement above
		// The docker container will then need to be rebuilt after the change is made:
		// Run `make devenv sources=slow_proxy`
		// or run `docker-compose build` in the devenv folder
		//
		// slog.Info("Sleeping before proxying request", "sleepDuration", safeSleep, "requestURI", safeRequestUri, "headers", r.Header)
		<-time.After(sleep)
		proxy.ServeHTTP(w, r)
	})

	if err := http.ListenAndServe(":3011", nil); err != nil {
		slog.Error("Slow proxy server failed", "error", err)
		os.Exit(1)
	}
}
