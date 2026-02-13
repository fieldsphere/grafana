package main

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"

	"github.com/grafana/grafana/pkg/components/satokengen"
)

// placeholder key generator
func main() {
	// get number of keys to generate from args
	numKeys := 1
	if len(os.Args) > 1 {
		var err error
		numKeys, err = strconv.Atoi(os.Args[1])
		if err != nil {
			slog.Error("Invalid number of keys to generate", "value", os.Args[1], "error", err)
			os.Exit(1)
		}
	}

	for i := 0; i < numKeys; i++ {
		key, err := satokengen.New("pl")
		if err != nil {
			slog.Error("Generating key failed", "index", i, "error", err)
			os.Exit(1)
		}

		fmt.Printf("\nGenerated key: %d:\n", i+1)
		fmt.Println(key.ClientSecret)
		fmt.Printf("\nGenerated key hash: %d \n", i+1)
		fmt.Println(key.HashedKey)
	}
}
