package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sync"
	"time"
)

var (
	fingerprints = make(Fingerprints)
	mu           sync.Mutex
	waitSeconds  int
	logFile      bool
	logFileName  = filepath.Join(os.TempDir(), "/logs/webhook-listener.log")
	dumpDir      = filepath.Join(os.TempDir(), "/logs/dumps")
)

type Alert struct {
	Fingerprint string    `json:"fingerprint"`
	StartsAt    time.Time `json:"startsAt"`
	Status      string    `json:"status"`
}

type Data struct {
	Receiver string  `json:"receiver"`
	Status   string  `json:"status"`
	Alerts   []Alert `json:"alerts"`
}

// Fingerprints keeps track of the number of alerts received
// by fingerprint and StartsAt time.
type Fingerprints map[string]map[time.Time]tracker

type tracker struct {
	Updates  int      `json:"updates"`
	Statuses []string `json:"statuses"`
}

func updateFingerprints(v Data) {
	mu.Lock()
	defer mu.Unlock()
	for _, alert := range v.Alerts {
		m, ok := fingerprints[alert.Fingerprint]
		if !ok {
			m = make(map[time.Time]tracker)
		}

		t, ok := m[alert.StartsAt]
		if !ok {
			t = tracker{
				Updates:  0,
				Statuses: []string{},
			}
		}

		t.Updates += 1
		t.Statuses = append(t.Statuses, alert.Status)

		m[alert.StartsAt] = t
		fingerprints[alert.Fingerprint] = m
	}
}

func parseFlags() {
	flag.BoolVar(&logFile, "log-file", true, "Whether to log to file")
	flag.IntVar(&waitSeconds, "wait-seconds", 0, "The number of seconds to wait before sending an HTTP response")
	flag.Parse()
}

func saveDump(data []byte) {
	if !logFile {
		return
	}

	if len(data) == 0 {
		fmt.Println("empty dump - not saving")
		return
	}
	ts := time.Now().UnixNano()
	name := path.Join(dumpDir, fmt.Sprintf("%d.json", ts))
	for i := 1; i <= 1000; i++ {
		if _, err := os.Stat(name); os.IsNotExist(err) {
			break
		}
		name = path.Join(dumpDir, fmt.Sprintf("%d_%04d.json", ts, i))
	}
	slog.Info("Saving dump", "path", name)
	err := os.WriteFile(name, data, os.ModePerm)
	if err != nil {
		slog.Error("Cannot save to file", "path", name, "error", err)
	}
}

func main() {
	parseFlags()

	_, err := os.Stat(dumpDir)
	if os.IsNotExist(err) {
		err = os.MkdirAll(dumpDir, os.ModePerm)
		if err != nil {
			slog.Error("Can't create directory", "path", dumpDir)
			panic(err)
		}
	}

	if logFile {
		//create your file with desired read/write permissions
		f, err := os.OpenFile(logFileName, os.O_WRONLY|os.O_CREATE|os.O_APPEND, os.ModePerm)
		if err != nil {
			slog.Error("Failed to open log file", "path", logFileName, "error", err)
			os.Exit(1)
		}
		defer f.Close()
		slog.SetDefault(slog.New(slog.NewTextHandler(f, nil)))
	}

	waitDuration := time.Duration(waitSeconds) * time.Second
	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusOK)
		writer.Write([]byte(landingPage))
	})

	http.HandleFunc("/listen", func(w http.ResponseWriter, r *http.Request) {
		slog.Info("Received submission", "remoteAddr", r.RemoteAddr)
		b, err := io.ReadAll(r.Body)
		if err != nil {
			slog.Error("Failed to read request body", "error", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		saveDump(b)
		v := Data{}
		if err := json.Unmarshal(b, &v); err != nil {
			slog.Error("Failed to unmarshal data", "error", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		slog.Info("Received alert data", "receiver", v.Receiver, "status", v.Status)
		updateFingerprints(v)
		<-time.After(waitDuration)
	})
	http.HandleFunc("/fingerprints", func(w http.ResponseWriter, r *http.Request) {
		b, err := func() ([]byte, error) {
			mu.Lock()
			defer mu.Unlock()
			return json.Marshal(fingerprints)
		}()
		if err != nil {
			slog.Error("Failed to marshal fingerprints", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Add("Content-Type", "application/json")
		w.Write(b)
	})
	slog.Info("Listening", "addr", "0.0.0.0:8080", "waitDuration", waitDuration)
	http.ListenAndServe("0.0.0.0:8080", nil)
}

const landingPage = `
<!doctype html>
<html>
<head>
<title>Webhook listener</title>
</head>
<body>
	<h1>Webhook Listener<h1>

	<p> For setup, please point your webhook configuration to the "/listen" endpoint. </p>
	<p> For debugging, please use the "/fingerprints" endpoint. </p>
</body>
</html>
`
