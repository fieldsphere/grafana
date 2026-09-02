package org

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	"k8s.io/apiserver/pkg/authorization/authorizer"

	claims "github.com/grafana/authlib/types"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
)

func TestOrgAuthorizer(t *testing.T) {
	authz := (&OrgAPIBuilder{}).GetAuthorizer()

	orgAdmin := identity.WithRequester(context.Background(), &identity.StaticRequester{
		Type:    claims.TypeUser,
		UserID:  2,
		UserUID: "admin",
		OrgID:   1,
		OrgRole: identity.RoleAdmin,
	})
	viewer := identity.WithRequester(context.Background(), &identity.StaticRequester{
		Type:    claims.TypeUser,
		UserID:  3,
		UserUID: "viewer",
		OrgID:   1,
		OrgRole: identity.RoleViewer,
	})
	grafanaAdmin := identity.WithRequester(context.Background(), &identity.StaticRequester{
		Type:           claims.TypeUser,
		UserID:         1,
		UserUID:        "gadmin",
		OrgID:          1,
		IsGrafanaAdmin: true,
	})
	canCreate := identity.WithRequester(context.Background(), &identity.StaticRequester{
		Type:    claims.TypeUser,
		UserID:  4,
		UserUID: "creator",
		OrgID:   1,
		OrgRole: identity.RoleViewer,
		Permissions: map[int64]map[string][]string{
			0: {accesscontrol.ActionOrgsCreate: {}},
		},
	})

	decision, _, err := authz.Authorize(orgAdmin, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "organizations", Verb: "list",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionDeny, decision)

	decision, _, err = authz.Authorize(orgAdmin, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "organizations", Verb: "create",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionDeny, decision)

	decision, _, err = authz.Authorize(canCreate, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "organizations", Verb: "create",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionAllow, decision)

	decision, _, err = authz.Authorize(orgAdmin, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "organizations", Verb: "get", Name: "1",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionAllow, decision)

	decision, _, err = authz.Authorize(orgAdmin, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "organizations", Verb: "get", Name: "9",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionDeny, decision)

	decision, _, err = authz.Authorize(viewer, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "orgmemberships", Verb: "list",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionAllow, decision)

	decision, _, err = authz.Authorize(viewer, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "orgmemberships", Verb: "create",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionDeny, decision)

	decision, _, err = authz.Authorize(orgAdmin, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "orgmemberships", Verb: "get", Name: "9.u4",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionDeny, decision)

	decision, _, err = authz.Authorize(grafanaAdmin, authorizer.AttributesRecord{
		ResourceRequest: true, Resource: "organizations", Verb: "list",
	})
	require.NoError(t, err)
	require.Equal(t, authorizer.DecisionAllow, decision)
}
