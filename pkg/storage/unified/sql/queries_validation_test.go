package sql

import (
	"strings"
	"testing"

	"github.com/grafana/grafana/pkg/storage/unified/resource"
	"github.com/grafana/grafana/pkg/storage/unified/resourcepb"
)

func TestSqlResourceRequest_Validate(t *testing.T) {
	validKey := &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r", Name: "n"}
	t.Run("valid", func(t *testing.T) {
		r := sqlResourceRequest{WriteEvent: resource.WriteEvent{Key: validKey}}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("missing key", func(t *testing.T) {
		r := sqlResourceRequest{}
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "missing key") {
			t.Fatalf("expected missing key error, got %v", err)
		}
	})
	t.Run("missing group", func(t *testing.T) {
		r := sqlResourceRequest{WriteEvent: resource.WriteEvent{Key: &resourcepb.ResourceKey{Namespace: "ns", Resource: "r"}}}
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "missing group") {
			t.Fatalf("expected missing group error, got %v", err)
		}
	})
}

func TestSqlResourceReadRequest_Validate(t *testing.T) {
	validKey := &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r", Name: "n"}
	t.Run("valid", func(t *testing.T) {
		r := &sqlResourceReadRequest{
			Request: &resourcepb.ReadRequest{Key: validKey},
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("nil receiver", func(t *testing.T) {
		var r *sqlResourceReadRequest
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "missing read request") {
			t.Fatalf("expected missing read request, got %v", err)
		}
	})
	t.Run("negative rv", func(t *testing.T) {
		r := &sqlResourceReadRequest{
			Request: &resourcepb.ReadRequest{Key: validKey, ResourceVersion: -1},
		}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestSqlResourceListRequest_Validate(t *testing.T) {
	validOpts := &resourcepb.ListOptions{Key: &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r"}}
	t.Run("valid", func(t *testing.T) {
		r := sqlResourceListRequest{Request: &resourcepb.ListRequest{Options: validOpts, Limit: 10}}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("missing options", func(t *testing.T) {
		r := sqlResourceListRequest{Request: &resourcepb.ListRequest{}}
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "missing list options key") {
			t.Fatalf("expected options error, got %v", err)
		}
	})
	t.Run("negative limit", func(t *testing.T) {
		r := sqlResourceListRequest{Request: &resourcepb.ListRequest{Options: validOpts, Limit: -1}}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestSqlResourceHistoryPollRequest_Validate(t *testing.T) {
	t.Run("valid", func(t *testing.T) {
		r := &sqlResourceHistoryPollRequest{
			Group:                "g",
			Resource:             "r",
			SinceResourceVersion: 0,
			Response:             new(historyPollResponse),
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("nil response", func(t *testing.T) {
		r := &sqlResourceHistoryPollRequest{Group: "g", Resource: "r"}
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "missing response") {
			t.Fatalf("expected missing response, got %v", err)
		}
	})
	t.Run("negative since", func(t *testing.T) {
		r := &sqlResourceHistoryPollRequest{
			Group:                "g",
			Resource:             "r",
			SinceResourceVersion:   -1,
			Response:             new(historyPollResponse),
		}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestSqlResourceHistoryReadRequest_Validate(t *testing.T) {
	validKey := &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r", Name: "n"}
	t.Run("valid", func(t *testing.T) {
		r := sqlResourceHistoryReadRequest{
			Request: &historyReadRequest{Key: validKey, ResourceVersion: 1},
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("missing key field", func(t *testing.T) {
		r := sqlResourceHistoryReadRequest{Request: &historyReadRequest{ResourceVersion: 1}}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestSqlResourceHistoryReadLatestRVRequest_Validate(t *testing.T) {
	validKey := &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r", Name: "n"}
	collectionKey := &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r"}
	t.Run("valid added", func(t *testing.T) {
		r := sqlResourceHistoryReadLatestRVRequest{
			Request: &historyReadLatestRVRequest{Key: validKey, EventType: resourcepb.WatchEvent_ADDED},
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("invalid collection scoped without name", func(t *testing.T) {
		r := sqlResourceHistoryReadLatestRVRequest{
			Request: &historyReadLatestRVRequest{Key: collectionKey, EventType: resourcepb.WatchEvent_DELETED},
		}
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "missing name") {
			t.Fatalf("expected missing name error, got %v", err)
		}
	})
	t.Run("invalid event type", func(t *testing.T) {
		r := sqlResourceHistoryReadLatestRVRequest{
			Request: &historyReadLatestRVRequest{Key: validKey, EventType: resourcepb.WatchEvent_Type(99)},
		}
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "invalid watch event type") {
			t.Fatalf("expected invalid type error, got %v", err)
		}
	})
}

func TestSqlResourceHistoryListRequest_Validate(t *testing.T) {
	validOpts := &resourcepb.ListOptions{Key: &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r"}}
	t.Run("valid", func(t *testing.T) {
		r := sqlResourceHistoryListRequest{
			Request: &historyListRequest{ResourceVersion: 1, Options: validOpts},
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("rv too low", func(t *testing.T) {
		r := sqlResourceHistoryListRequest{
			Request: &historyListRequest{ResourceVersion: 0, Options: validOpts},
		}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestSqlGetHistoryRequest_Validate(t *testing.T) {
	validKey := &resourcepb.ResourceKey{Namespace: "ns", Group: "g", Resource: "r"}
	t.Run("valid", func(t *testing.T) {
		r := sqlGetHistoryRequest{Key: validKey}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("negative bound", func(t *testing.T) {
		r := sqlGetHistoryRequest{Key: validKey, StartRV: -1}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestSqlResourceVersionListRequest_Validate(t *testing.T) {
	t.Run("valid", func(t *testing.T) {
		r := &sqlResourceVersionListRequest{groupResourceVersion: new(groupResourceVersion)}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil, got %v", err)
		}
	})
	t.Run("nil holder", func(t *testing.T) {
		r := &sqlResourceVersionListRequest{}
		if err := r.Validate(); err == nil || !strings.Contains(err.Error(), "missing response holder") {
			t.Fatalf("expected holder error, got %v", err)
		}
	})
}
