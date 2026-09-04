package org

import (
	"context"
	"strconv"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/authorization/authorizer"
	"k8s.io/apiserver/pkg/registry/rest"
	genericapiserver "k8s.io/apiserver/pkg/server"
	"k8s.io/kube-openapi/pkg/common"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	orgv0 "github.com/grafana/grafana/pkg/apis/org/v0alpha1"
	"github.com/grafana/grafana/pkg/services/apiserver/builder"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
)

var _ builder.APIGroupBuilder = (*OrgAPIBuilder)(nil)

type OrgAPIBuilder struct {
	orgs     org.Service
	deleter  org.DeletionService
	users    user.Service
	features featuremgmt.FeatureToggles
}

func RegisterAPIService(
	features featuremgmt.FeatureToggles,
	apiregistration builder.APIRegistrar,
	orgs org.Service,
	deleter org.DeletionService,
	users user.Service,
) *OrgAPIBuilder {
	b := &OrgAPIBuilder{
		orgs:     orgs,
		deleter:  deleter,
		users:    users,
		features: features,
	}
	if features != nil && features.IsEnabledGlobally(featuremgmt.FlagKubernetesOrgsApi) { //nolint:staticcheck
		apiregistration.RegisterAPI(b)
	}
	return b
}

func (b *OrgAPIBuilder) GetGroupVersion() schema.GroupVersion {
	return orgv0.SchemeGroupVersion
}

func (b *OrgAPIBuilder) InstallSchema(scheme *runtime.Scheme) error {
	if err := orgv0.AddToScheme(scheme); err != nil {
		return err
	}
	metav1.AddToGroupVersion(scheme, orgv0.SchemeGroupVersion)
	return scheme.SetVersionPriority(orgv0.SchemeGroupVersion)
}

func (b *OrgAPIBuilder) AllowedV0Alpha1Resources() []string {
	return []string{builder.AllResourcesAllowed}
}

func (b *OrgAPIBuilder) UpdateAPIGroupInfo(apiGroupInfo *genericapiserver.APIGroupInfo, _ builder.APIGroupOptions) error {
	storage := map[string]rest.Storage{
		orgv0.OrganizationResourceInfo.StoragePath():  newOrgStorage(b.orgs, b.deleter),
		orgv0.OrgMembershipResourceInfo.StoragePath(): newMembershipStorage(b.orgs, b.users),
	}
	apiGroupInfo.VersionedResourcesStorageMap[orgv0.VERSION] = storage
	return nil
}

func (b *OrgAPIBuilder) GetOpenAPIDefinitions() common.GetOpenAPIDefinitions {
	return orgv0.GetOpenAPIDefinitions
}

func (b *OrgAPIBuilder) GetAuthorizer() authorizer.Authorizer {
	return authorizer.AuthorizerFunc(func(ctx context.Context, attr authorizer.Attributes) (authorizer.Decision, string, error) {
		if !attr.IsResourceRequest() {
			return authorizer.DecisionNoOpinion, "", nil
		}
		u, err := identity.GetRequester(ctx)
		if err != nil {
			return authorizer.DecisionDeny, "valid user is required", err
		}
		if u.GetIsGrafanaAdmin() {
			return authorizer.DecisionAllow, "", nil
		}

		// Global org (id 0) is a special authz path — grafana admins only.
		if attr.GetName() == "0" {
			return authorizer.DecisionDeny, "global org is grafana-admin only", nil
		}

		if u.GetOrgRole() != identity.RoleAdmin {
			return authorizer.DecisionDeny, "organization admin required", nil
		}

		switch attr.GetResource() {
		case "organizations":
			if attr.GetName() == "" || attr.GetName() == strconv.FormatInt(u.GetOrgID(), 10) {
				return authorizer.DecisionAllow, "", nil
			}
			return authorizer.DecisionDeny, "cannot access another organization", nil
		case "orgmemberships":
			orgID, _, parseErr := parseMembershipName(attr.GetName())
			if parseErr != nil && attr.GetVerb() != "list" && attr.GetVerb() != "create" {
				return authorizer.DecisionDeny, "invalid membership name", nil
			}
			if parseErr == nil && orgID != u.GetOrgID() {
				return authorizer.DecisionDeny, "cannot manage another organization's membership", nil
			}
			return authorizer.DecisionAllow, "", nil
		default:
			return authorizer.DecisionDeny, "forbidden", nil
		}
	})
}
