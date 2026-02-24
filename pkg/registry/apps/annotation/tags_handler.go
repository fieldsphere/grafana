package annotation

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"

	"github.com/grafana/grafana-app-sdk/app"
)

type tagResponse struct {
	Tags []tagItem `json:"tags"`
}

type tagItem struct {
	Tag   string `json:"tag"`
	Count int64  `json:"count"`
}

func newTagsHandler(tagProvider TagProvider) func(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
	return func(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
		fmt.Println("Handling /tags request")
		namespace := request.ResourceIdentifier.Namespace
		if namespace == "" {
			namespace = "default"
		}
		opts := tagListOptionsFromQueryParams(request.URL.Query())
		tags, err := tagProvider.ListTags(ctx, namespace, opts)
		if err != nil {
			return err
		}
		items := make([]tagItem, len(tags))
		for i, tag := range tags {
			items[i] = tagItem{
				Tag:   tag.Name,
				Count: tag.Count,
			}
		}

		response := tagResponse{
			Tags: items,
		}

		return json.NewEncoder(writer).Encode(response)
	}
}

func tagListOptionsFromQueryParams(queryParams url.Values) TagListOptions {
	opts := TagListOptions{}

	if v := queryParams.Get("tag"); v != "" {
		opts.Prefix = v
	}

	if v := queryParams.Get("limit"); v != "" {
		if limit, err := strconv.Atoi(v); err == nil && limit > 0 {
			opts.Limit = limit
		}
	}

	return opts
}
