package org

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	claims "github.com/grafana/authlib/types"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	orgv0 "github.com/grafana/grafana/pkg/apis/org/v0alpha1"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/org/orgtest"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/services/user/usertest"
)

func TestOrgStorageGetAndList(t *testing.T) {
	svc := orgtest.NewOrgServiceFake()
	svc.ExpectedOrg = &org.Org{ID: 2, Name: "Ops"}
	svc.ExpectedOrgs = []*org.OrgDTO{{ID: 2, Name: "Ops"}, {ID: 3, Name: "Sales"}}
	store := newOrgStorage(svc, orgtest.NewOrgDeletionServiceFake())

	got, err := store.Get(context.Background(), "2", &metav1.GetOptions{})
	require.NoError(t, err)
	res := got.(*orgv0.Organization)
	require.Equal(t, "2", res.Name)
	require.Equal(t, "Ops", res.Spec.Name)

	list, err := store.List(context.Background(), nil)
	require.NoError(t, err)
	items := list.(*orgv0.OrganizationList).Items
	require.Len(t, items, 2)
	require.Equal(t, "3", items[1].Name)
}

func TestOrgStorageCreateUsesRequesterAsAdmin(t *testing.T) {
	svc := orgtest.NewOrgServiceFake()
	svc.ExpectedOrg = &org.Org{ID: 9, Name: "New Org"}
	store := newOrgStorage(svc, nil)

	ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{
		Type:   claims.TypeUser,
		UserID: 11,
		OrgID:  1,
		Login:  "admin",
	})
	created, err := store.Create(ctx, &orgv0.Organization{
		Spec: orgv0.OrganizationSpec{Name: "New Org"},
	}, nil, &metav1.CreateOptions{})
	require.NoError(t, err)
	require.Equal(t, "9", created.(*orgv0.Organization).Name)
}

func TestMembershipStorageCreateAndGet(t *testing.T) {
	orgs := orgtest.NewOrgServiceFake()
	orgs.ExpectedSearchOrgUsersResult = &org.SearchOrgUsersQueryResult{
		OrgUsers: []*org.OrgUserDTO{{
			OrgID:  1,
			UserID: 4,
			UID:    "u4",
			Role:   "Editor",
		}},
	}
	users := &usertest.FakeUserService{ExpectedUser: &user.User{ID: 4, UID: "u4", Login: "editor"}}
	store := newMembershipStorage(orgs, users)

	got, err := store.Get(context.Background(), "1.u4", &metav1.GetOptions{})
	require.NoError(t, err)
	require.Equal(t, "Editor", got.(*orgv0.OrgMembership).Spec.Role)
}
