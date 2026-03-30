package sql

import (
	"database/sql"
	"embed"
	"fmt"
	"text/template"
	"time"

	"github.com/grafana/grafana/pkg/apimachinery/utils"
	"github.com/grafana/grafana/pkg/storage/unified/resource"
	"github.com/grafana/grafana/pkg/storage/unified/resourcepb"
	"github.com/grafana/grafana/pkg/storage/unified/sql/sqltemplate"
)

// Templates setup.
var (
	//go:embed data/*.sql
	sqlTemplatesFS embed.FS

	sqlTemplates = template.Must(template.New("sql").ParseFS(sqlTemplatesFS, `data/*.sql`))
)

func mustTemplate(filename string) *template.Template {
	if t := sqlTemplates.Lookup(filename); t != nil {
		return t
	}
	panic(fmt.Sprintf("template file not found: %s", filename))
}

// Templates.
var (
	sqlResourceDelete                      = mustTemplate("resource_delete.sql")
	sqlResourceInsert                      = mustTemplate("resource_insert.sql")
	sqlResourceUpdate                      = mustTemplate("resource_update.sql")
	sqlResourceRead                        = mustTemplate("resource_read.sql")
	sqlResourceStats                       = mustTemplate("resource_stats.sql")
	sqlResourceList                        = mustTemplate("resource_list.sql")
	sqlResourceHistoryList                 = mustTemplate("resource_history_list.sql")
	sqlResourceHistoryListModifiedSince    = mustTemplate("resource_history_list_since_modified.sql")
	sqlResourceHistoryRead                 = mustTemplate("resource_history_read.sql")
	sqlResourceHistoryReadLatestRV         = mustTemplate("resource_history_read_latest_rv.sql")
	sqlResourceHistoryInsert               = mustTemplate("resource_history_insert.sql")
	sqlResourceHistoryInsertBulk           = mustTemplate("resource_history_insert_bulk.sql")
	sqlResourceHistoryPoll                 = mustTemplate("resource_history_poll.sql")
	sqlResourceHistoryGet                  = mustTemplate("resource_history_get.sql")
	sqlResourceHistoryDelete               = mustTemplate("resource_history_delete.sql")
	sqlResourceHistoryPrune                = mustTemplate("resource_history_prune.sql")
	sqlResourceHistoryGarbageGetCandidates = mustTemplate("resource_history_gc_get_candidates.sql")
	sqlResourceHistoryGCDeleteByNames      = mustTemplate("resource_history_gc_delete_by_names.sql")
	sqlResourceTrash                       = mustTemplate("resource_trash.sql")
	sqlResourceInsertFromHistory           = mustTemplate("resource_insert_from_history.sql")

	// sqlResourceLabelsInsert = mustTemplate("resource_labels_insert.sql")
	sqlResourceVersionList = mustTemplate("resource_version_list.sql")

	sqlResourceBlobInsert = mustTemplate("resource_blob_insert.sql")
	sqlResourceBlobQuery  = mustTemplate("resource_blob_query.sql")

	sqlResourceLastImportTimeInsert = mustTemplate("resource_last_import_time_insert.sql")
	sqlResourceLastImportTimeQuery  = mustTemplate("resource_last_import_time_query.sql")
	sqlResourceLastImportTimeDelete = mustTemplate("resource_last_import_time_delete.sql")
)

// TxOptions.
var (
	ReadCommitted = &sql.TxOptions{
		Isolation: sql.LevelReadCommitted,
	}
	ReadCommittedRO = &sql.TxOptions{
		Isolation: sql.LevelReadCommitted,
		ReadOnly:  true,
	}
	RepeatableRead = &sql.TxOptions{
		Isolation: sql.LevelRepeatableRead,
	}
)

type sqlResourceRequest struct {
	sqltemplate.SQLTemplate
	GUID       string
	WriteEvent resource.WriteEvent
	Generation int64
	Folder     string
	KeyPath    string

	// Useful when batch writing
	ResourceVersion int64
}

func validateResourceKeyRead(k *resourcepb.ResourceKey) error {
	if k == nil {
		return fmt.Errorf("missing key")
	}
	if k.Namespace == "" {
		return fmt.Errorf("missing namespace")
	}
	if k.Group == "" {
		return fmt.Errorf("missing group")
	}
	if k.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	if k.Name == "" {
		return fmt.Errorf("missing name")
	}
	return nil
}

// validateResourceKeyGroupResource matches storage row identity for writes and collection-scoped deletes: group and resource are required; namespace and name may be empty (cluster-scoped or collection-wide operations).
func validateResourceKeyGroupResource(k *resourcepb.ResourceKey) error {
	if k == nil {
		return fmt.Errorf("missing key")
	}
	if k.Group == "" {
		return fmt.Errorf("missing group")
	}
	if k.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	return nil
}

// validateResourceKeyListScope matches list queries: group and resource are required; namespace may be empty (cluster-scoped).
func validateResourceKeyListScope(k *resourcepb.ResourceKey) error {
	return validateResourceKeyGroupResource(k)
}

// validateResourceKeyHistoryScope matches history/trash collection queries: namespace, group, and resource are required; name may be empty.
func validateResourceKeyHistoryScope(k *resourcepb.ResourceKey) error {
	if k == nil {
		return fmt.Errorf("missing key")
	}
	if k.Namespace == "" {
		return fmt.Errorf("missing namespace")
	}
	if k.Group == "" {
		return fmt.Errorf("missing group")
	}
	if k.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	return nil
}

func (r sqlResourceRequest) Validate() error {
	if r.WriteEvent.Key == nil {
		return fmt.Errorf("missing key")
	}
	return validateResourceKeyGroupResource(r.WriteEvent.Key)
}

type sqlBulkResourceHistoryInsertRequest struct {
	sqltemplate.SQLTemplate
	Rows []sqlResourceRequest
}

func (r sqlBulkResourceHistoryInsertRequest) Validate() error {
	if len(r.Rows) == 0 {
		return fmt.Errorf("missing rows")
	}
	for _, row := range r.Rows {
		if row.WriteEvent.Key == nil {
			return fmt.Errorf("missing key")
		}
		if row.ResourceVersion <= 0 {
			return fmt.Errorf("missing resource version")
		}
	}
	return nil
}

type sqlResourceInsertFromHistoryRequest struct {
	sqltemplate.SQLTemplate
	Key *resourcepb.ResourceKey
}

func (r sqlResourceInsertFromHistoryRequest) Validate() error {
	if r.Key == nil {
		return fmt.Errorf("missing key")
	}
	return nil
}

type sqlStatsRequest struct {
	sqltemplate.SQLTemplate
	Namespace string
	Group     string
	Resource  string
	Folder    string
	MinCount  int
}

func (r sqlStatsRequest) Validate() error {
	if r.Folder != "" && r.Namespace == "" {
		return fmt.Errorf("folder constraint requires a namespace")
	}
	return nil
}

type historyPollResponse struct {
	Key             resourcepb.ResourceKey
	GUID            string
	ResourceVersion int64
	PreviousRV      *int64
	Value           []byte
	Action          int
	Folder          string
}

func (r *historyPollResponse) Results() (*historyPollResponse, error) {
	return r, nil
}

type groupResourceRV map[string]map[string]int64

type sqlResourceHistoryPollRequest struct {
	sqltemplate.SQLTemplate
	Resource             string
	Group                string
	SinceResourceVersion int64
	Response             *historyPollResponse
}

func (r *sqlResourceHistoryPollRequest) Validate() error {
	if r == nil {
		return fmt.Errorf("missing poll request")
	}
	if r.Group == "" {
		return fmt.Errorf("missing group")
	}
	if r.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	if r.SinceResourceVersion < 0 {
		return fmt.Errorf("since resource version must be greater than or equal to zero")
	}
	if r.Response == nil {
		return fmt.Errorf("missing response")
	}
	return nil
}

func (r *sqlResourceHistoryPollRequest) Results() (*historyPollResponse, error) {
	prevRV := r.Response.PreviousRV
	if prevRV == nil {
		prevRV = new(int64)
	}
	return &historyPollResponse{
		Key: resourcepb.ResourceKey{
			Namespace: r.Response.Key.Namespace,
			Group:     r.Response.Key.Group,
			Resource:  r.Response.Key.Resource,
			Name:      r.Response.Key.Name,
		},
		Folder:          r.Response.Folder,
		ResourceVersion: r.Response.ResourceVersion,
		PreviousRV:      prevRV,
		Value:           r.Response.Value,
		Action:          r.Response.Action,
	}, nil
}

// sqlResourceReadRequest can be used to retrieve a row fromthe "resource" tables.
func NewReadResponse() *resource.BackendReadResponse {
	return &resource.BackendReadResponse{
		Key: &resourcepb.ResourceKey{},
	}
}

type sqlResourceReadRequest struct {
	sqltemplate.SQLTemplate
	Request  *resourcepb.ReadRequest
	Response *resource.BackendReadResponse
}

func (r *sqlResourceReadRequest) Validate() error {
	if r == nil {
		return fmt.Errorf("missing read request")
	}
	if r.Request == nil {
		return fmt.Errorf("missing request")
	}
	if err := validateResourceKeyRead(r.Request.Key); err != nil {
		return err
	}
	if r.Request.ResourceVersion < 0 {
		return fmt.Errorf("resource version must be greater than or equal to zero")
	}
	return nil
}

func (r *sqlResourceReadRequest) Results() (*resource.BackendReadResponse, error) {
	return r.Response, nil
}

// List
type sqlResourceListRequest struct {
	sqltemplate.SQLTemplate
	Request *resourcepb.ListRequest
}

func (r sqlResourceListRequest) Validate() error {
	if r.Request == nil {
		return fmt.Errorf("missing request")
	}
	if r.Request.Options == nil || r.Request.Options.Key == nil {
		return fmt.Errorf("missing list options key")
	}
	if err := validateResourceKeyListScope(r.Request.Options.Key); err != nil {
		return err
	}
	if r.Request.Limit < 0 {
		return fmt.Errorf("limit must be greater than or equal to zero")
	}
	if r.Request.ResourceVersion < 0 {
		return fmt.Errorf("resource version must be greater than or equal to zero")
	}
	return nil
}

type historyReadRequest struct {
	Key             *resourcepb.ResourceKey
	ResourceVersion int64
}

type sqlResourceHistoryReadRequest struct {
	sqltemplate.SQLTemplate
	Request  *historyReadRequest
	Response *resource.BackendReadResponse
}

func (r sqlResourceHistoryReadRequest) Validate() error {
	if r.Request == nil {
		return fmt.Errorf("missing request")
	}
	if err := validateResourceKeyRead(r.Request.Key); err != nil {
		return err
	}
	if r.Request.ResourceVersion < 0 {
		return fmt.Errorf("resource version must be greater than or equal to zero")
	}
	return nil
}

func (r sqlResourceHistoryReadRequest) Results() (*resource.BackendReadResponse, error) {
	return r.Response, nil
}

type historyReadLatestRVRequest struct {
	Key       *resourcepb.ResourceKey
	EventType resourcepb.WatchEvent_Type
}

type sqlResourceHistoryReadLatestRVRequest struct {
	sqltemplate.SQLTemplate
	Request  *historyReadLatestRVRequest
	Response *resourceHistoryReadLatestRVResponse
}

func (r sqlResourceHistoryReadLatestRVRequest) Validate() error {
	if r.Request == nil {
		return fmt.Errorf("missing request")
	}
	if err := validateResourceKeyHistoryScope(r.Request.Key); err != nil {
		return err
	}
	switch r.Request.EventType {
	case resourcepb.WatchEvent_UNKNOWN,
		resourcepb.WatchEvent_ADDED,
		resourcepb.WatchEvent_MODIFIED,
		resourcepb.WatchEvent_DELETED,
		resourcepb.WatchEvent_BOOKMARK,
		resourcepb.WatchEvent_ERROR:
		// valid
	default:
		return fmt.Errorf("invalid watch event type")
	}
	return nil
}

func (r sqlResourceHistoryReadLatestRVRequest) Results() (*resourceHistoryReadLatestRVResponse, error) {
	return r.Response, nil
}

type resourceHistoryReadLatestRVResponse struct {
	ResourceVersion int64
}

func (r *resourceHistoryReadLatestRVResponse) Results() (*resourceHistoryReadLatestRVResponse, error) {
	return r, nil
}

type historyListRequest struct {
	ResourceVersion, Limit, Offset int64
	Folder                         string
	Options                        *resourcepb.ListOptions
}
type sqlResourceHistoryListRequest struct {
	sqltemplate.SQLTemplate
	Request  *historyListRequest
	Response *resourcepb.ResourceWrapper
}

func (r sqlResourceHistoryListRequest) Validate() error {
	if r.Request == nil {
		return fmt.Errorf("missing request")
	}
	if r.Request.Options == nil || r.Request.Options.Key == nil {
		return fmt.Errorf("missing list options key")
	}
	if err := validateResourceKeyListScope(r.Request.Options.Key); err != nil {
		return err
	}
	if r.Request.ResourceVersion < 1 {
		return fmt.Errorf("resource version must be at least 1")
	}
	if r.Request.Limit < 0 || r.Request.Offset < 0 {
		return fmt.Errorf("limit and offset must be greater than or equal to zero")
	}
	return nil
}

func (r sqlResourceHistoryListRequest) Results() (*resourcepb.ResourceWrapper, error) {
	// sqlResourceHistoryListRequest is a set-returning query. As such, it
	// should not return its *Response, since that will be overwritten in the
	// next call to `Scan`, so it needs to return a copy of it. Note, though,
	// that it is safe to return the same `Response.Value` since `Scan`
	// allocates a new slice of bytes each time.
	return &resourcepb.ResourceWrapper{
		ResourceVersion: r.Response.ResourceVersion,
		Value:           r.Response.Value,
	}, nil
}

type sqlResourceHistoryDeleteRequest struct {
	sqltemplate.SQLTemplate
	GUID string

	Namespace string
	Group     string
	Resource  string
}

func (r *sqlResourceHistoryDeleteRequest) Validate() error {
	if r.Namespace == "" {
		return fmt.Errorf("missing namespace")
	}
	if r.GUID == "" {
		if r.Group == "" {
			return fmt.Errorf("missing group")
		}
		if r.Resource == "" {
			return fmt.Errorf("missing resource")
		}
	}
	return nil
}

type sqlGetHistoryRequest struct {
	sqltemplate.SQLTemplate
	Key           *resourcepb.ResourceKey
	Trash         bool  // only deleted items
	StartRV       int64 // from NextPageToken
	MinRV         int64 // minimum resource version for NotOlderThan
	ExactRV       int64 // exact resource version for Exact
	SortAscending bool  // if true, sort by resource_version ASC, otherwise DESC
}

func (r sqlGetHistoryRequest) Validate() error {
	if err := validateResourceKeyHistoryScope(r.Key); err != nil {
		return err
	}
	if r.StartRV < 0 || r.MinRV < 0 || r.ExactRV < 0 {
		return fmt.Errorf("resource version bounds must be greater than or equal to zero")
	}
	return nil
}

// prune resource history
type sqlPruneHistoryRequest struct {
	sqltemplate.SQLTemplate
	Key                   *resourcepb.ResourceKey
	PartitionByGeneration bool // include generation in the partition
	HistoryLimit          int64
}

func (r *sqlPruneHistoryRequest) Validate() error {
	if r.HistoryLimit <= 0 {
		return fmt.Errorf("history limit must be greater than zero")
	}
	if r.Key == nil {
		return fmt.Errorf("missing key")
	}
	if r.Key.Group == "" {
		return fmt.Errorf("missing group")
	}
	if r.Key.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	return nil
}

type gcCandidateName struct {
	Namespace string
	Name      string
}

type sqlGarbageCollectCandidatesRequest struct {
	sqltemplate.SQLTemplate
	Group           string
	Resource        string
	CutoffTimestamp int64
	BatchSize       int
	Response        *gcCandidateName
}

func (r *sqlGarbageCollectCandidatesRequest) Validate() error {
	if r.Group == "" {
		return fmt.Errorf("missing group")
	}
	if r.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	if r.CutoffTimestamp <= 0 {
		return fmt.Errorf("invalid cutoff timestamp")
	}
	if r.BatchSize <= 0 {
		return fmt.Errorf("invalid batch size")
	}
	return nil
}

func (r *sqlGarbageCollectCandidatesRequest) Results() (gcCandidateName, error) {
	x := *r.Response
	return x, nil
}

type sqlGarbageCollectDeleteByNamesRequest struct {
	sqltemplate.SQLTemplate
	Group      string
	Resource   string
	Candidates []gcCandidateName
}

func (r *sqlGarbageCollectDeleteByNamesRequest) Validate() error {
	if r.Group == "" {
		return fmt.Errorf("missing group")
	}
	if r.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	if len(r.Candidates) == 0 {
		return fmt.Errorf("missing candidates")
	}
	return nil
}

type sqlResourceBlobInsertRequest struct {
	sqltemplate.SQLTemplate
	Now         time.Time
	Info        *utils.BlobInfo
	Key         *resourcepb.ResourceKey
	Value       []byte
	ContentType string
}

func (r sqlResourceBlobInsertRequest) Validate() error {
	if len(r.Value) < 1 {
		return fmt.Errorf("missing body")
	}
	return nil
}

type sqlResourceBlobQueryRequest struct {
	sqltemplate.SQLTemplate
	Key *resourcepb.ResourceKey
	UID string
}

func (r sqlResourceBlobQueryRequest) Validate() error {
	return nil
}

type groupResourceVersion struct {
	Group, Resource string
	ResourceVersion int64
}

type sqlResourceVersionListRequest struct {
	sqltemplate.SQLTemplate
	*groupResourceVersion
}

func (r *sqlResourceVersionListRequest) Validate() error {
	if r == nil || r.groupResourceVersion == nil {
		return fmt.Errorf("missing response holder")
	}
	return nil
}

func (r *sqlResourceVersionListRequest) Results() (*groupResourceVersion, error) {
	x := *r.groupResourceVersion
	return &x, nil
}

type sqlResourceListModifiedSinceRequest struct {
	sqltemplate.SQLTemplate
	Namespace string
	Group     string
	Resource  string
	SinceRv   int64 // Exclusive
	LatestRv  int64 // Inclusive
}

func (r sqlResourceListModifiedSinceRequest) Validate() error {
	if r.Namespace == "" {
		return fmt.Errorf("missing namespace")
	}
	if r.Group == "" {
		return fmt.Errorf("missing group")
	}
	if r.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	if r.SinceRv < 0 {
		return fmt.Errorf("since resource version must be greater than or equal to zero")
	}
	if r.LatestRv < r.SinceRv {
		return fmt.Errorf("latest resource version must be greater or equal to since resource version")
	}
	return nil
}

type sqlResourceLastImportTimeInsertRequest struct {
	sqltemplate.SQLTemplate
	Namespace      string
	Group          string
	Resource       string
	LastImportTime time.Time
}

func (r sqlResourceLastImportTimeInsertRequest) Validate() error {
	if r.Namespace == "" {
		return fmt.Errorf("missing namespace")
	}
	if r.Group == "" {
		return fmt.Errorf("missing group")
	}
	if r.Resource == "" {
		return fmt.Errorf("missing resource")
	}
	if r.LastImportTime.IsZero() {
		return fmt.Errorf("last import time cannot be zero")
	}
	return nil
}

type sqlResourceLastImportTimeQueryRequest struct {
	sqltemplate.SQLTemplate
}

func (r *sqlResourceLastImportTimeQueryRequest) Validate() error {
	return nil
}

type sqlResourceLastImportTimeDeleteRequest struct {
	sqltemplate.SQLTemplate
	Threshold time.Time
}

func (r *sqlResourceLastImportTimeDeleteRequest) Validate() error {
	return nil
}
