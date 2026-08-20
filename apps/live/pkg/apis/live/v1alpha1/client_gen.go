package v1alpha1

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/grafana/grafana-app-sdk/resource"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type CustomRouteClient struct {
	resource.CustomRouteClient
}

func NewCustomRouteClient(client resource.CustomRouteClient) *CustomRouteClient {
	return &CustomRouteClient{client}
}

func NewCustomRouteClientFromGenerator(generator resource.ClientGenerator, defaultNamespace string) (*CustomRouteClient, error) {
	client, err := generator.GetCustomRouteClient(schema.GroupVersion{
		Group:   "live.grafana.app",
		Version: "v1alpha1",
	}, defaultNamespace)
	if err != nil {
		return nil, err
	}
	return NewCustomRouteClient(client), nil
}

type GetListRequest struct {
	Headers http.Header
}

func (c *CustomRouteClient) GetList(ctx context.Context, namespace string, request GetListRequest) (*GetListResponse, error) {
	resp, err := c.NamespacedRequest(ctx, namespace, resource.CustomRouteRequestOptions{
		Path:    "/list",
		Verb:    "GET",
		Headers: request.Headers,
	})
	if err != nil {
		return nil, err
	}
	cast := GetListResponse{}
	err = json.Unmarshal(resp, &cast)
	if err != nil {
		return nil, fmt.Errorf("unable to unmarshal response bytes into GetListResponse: %w", err)
	}
	return &cast, nil
}

type GetPushRequest struct {
	Headers http.Header
}

func (c *CustomRouteClient) GetPush(ctx context.Context, namespace string, request GetPushRequest) (*GetPushResponse, error) {
	resp, err := c.NamespacedRequest(ctx, namespace, resource.CustomRouteRequestOptions{
		Path:    "/push/{streamId}",
		Verb:    "GET",
		Headers: request.Headers,
	})
	if err != nil {
		return nil, err
	}
	cast := GetPushResponse{}
	err = json.Unmarshal(resp, &cast)
	if err != nil {
		return nil, fmt.Errorf("unable to unmarshal response bytes into GetPushResponse: %w", err)
	}
	return &cast, nil
}

type CreatePushRequest struct {
	Headers http.Header
}

func (c *CustomRouteClient) CreatePush(ctx context.Context, namespace string, request CreatePushRequest) (*CreatePushResponse, error) {
	resp, err := c.NamespacedRequest(ctx, namespace, resource.CustomRouteRequestOptions{
		Path:    "/push/{streamId}",
		Verb:    "POST",
		Headers: request.Headers,
	})
	if err != nil {
		return nil, err
	}
	cast := CreatePushResponse{}
	err = json.Unmarshal(resp, &cast)
	if err != nil {
		return nil, fmt.Errorf("unable to unmarshal response bytes into CreatePushResponse: %w", err)
	}
	return &cast, nil
}

type GetSomethingRequest struct {
	Params  GetSomethingRequestParams
	Headers http.Header
}

func (c *CustomRouteClient) GetSomething(ctx context.Context, namespace string, request GetSomethingRequest) (*GetSomethingResponse, error) {
	params := url.Values{}
	resp, err := c.NamespacedRequest(ctx, namespace, resource.CustomRouteRequestOptions{
		Path:    "/something",
		Verb:    "GET",
		Query:   params,
		Headers: request.Headers,
	})
	if err != nil {
		return nil, err
	}
	cast := GetSomethingResponse{}
	err = json.Unmarshal(resp, &cast)
	if err != nil {
		return nil, fmt.Errorf("unable to unmarshal response bytes into GetSomethingResponse: %w", err)
	}
	return &cast, nil
}

type GetWsRequest struct {
	Headers http.Header
}

func (c *CustomRouteClient) GetWs(ctx context.Context, namespace string, request GetWsRequest) (*GetWsResponse, error) {
	resp, err := c.NamespacedRequest(ctx, namespace, resource.CustomRouteRequestOptions{
		Path:    "/ws",
		Verb:    "GET",
		Headers: request.Headers,
	})
	if err != nil {
		return nil, err
	}
	cast := GetWsResponse{}
	err = json.Unmarshal(resp, &cast)
	if err != nil {
		return nil, fmt.Errorf("unable to unmarshal response bytes into GetWsResponse: %w", err)
	}
	return &cast, nil
}
