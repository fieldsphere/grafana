package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
	if err := datasource.Manage("opentsdb", NewDatasource, datasource.ManageOpts{}); err != nil {
		log.DefaultLogger.Error("Standalone datasource startup failed", "error", err)
		os.Exit(1)
	}
}
