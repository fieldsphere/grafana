package v0alpha1

import (
	"fmt"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/grafana/grafana/pkg/apimachinery/utils"
)

const (
	GROUP      = "org.grafana.app"
	VERSION    = "v0alpha1"
	APIVERSION = GROUP + "/" + VERSION
)

var (
	OrganizationResourceInfo  utils.ResourceInfo
	OrgMembershipResourceInfo utils.ResourceInfo
)

func init() {
	orgInfo := utils.NewResourceInfo(GROUP, VERSION,
		"organizations", "organization", "Organization",
		func() runtime.Object { return &Organization{} },
		func() runtime.Object { return &OrganizationList{} },
		utils.TableColumns{
			Definition: []metav1.TableColumnDefinition{
				{Name: "Name", Type: "string", Format: "name"},
				{Name: "Display Name", Type: "string"},
				{Name: "Created At", Type: "date"},
			},
			Reader: func(obj any) ([]interface{}, error) {
				m, ok := obj.(*Organization)
				if !ok {
					return nil, fmt.Errorf("expected Organization")
				}
				return []interface{}{
					m.Name,
					m.Spec.Name,
					m.CreationTimestamp.UTC().Format(time.RFC3339),
				}, nil
			},
		},
	)
	OrganizationResourceInfo = orgInfo.WithClusterScope()

	memberInfo := utils.NewResourceInfo(GROUP, VERSION,
		"orgmemberships", "orgmembership", "OrgMembership",
		func() runtime.Object { return &OrgMembership{} },
		func() runtime.Object { return &OrgMembershipList{} },
		utils.TableColumns{
			Definition: []metav1.TableColumnDefinition{
				{Name: "Name", Type: "string", Format: "name"},
				{Name: "Org", Type: "string"},
				{Name: "User", Type: "string"},
				{Name: "Role", Type: "string"},
			},
			Reader: func(obj any) ([]interface{}, error) {
				m, ok := obj.(*OrgMembership)
				if !ok {
					return nil, fmt.Errorf("expected OrgMembership")
				}
				return []interface{}{
					m.Name,
					m.Spec.OrgRef,
					m.Spec.UserRef,
					m.Spec.Role,
				}, nil
			},
		},
	)
	OrgMembershipResourceInfo = memberInfo.WithClusterScope()
}

var (
	SchemeGroupVersion = schema.GroupVersion{Group: GROUP, Version: VERSION}
	SchemeBuilder      runtime.SchemeBuilder
	localSchemeBuilder = &SchemeBuilder
	AddToScheme        = localSchemeBuilder.AddToScheme
)

func init() {
	localSchemeBuilder.Register(addKnownTypes)
}

func addKnownTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(SchemeGroupVersion,
		&Organization{},
		&OrganizationList{},
		&OrgMembership{},
		&OrgMembershipList{},
	)
	metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
	return nil
}

func Resource(resource string) schema.GroupResource {
	return SchemeGroupVersion.WithResource(resource).GroupResource()
}
