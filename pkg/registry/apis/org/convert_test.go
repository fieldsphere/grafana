package org

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/org"
)

func TestOrgToResource(t *testing.T) {
	created := time.Date(2024, 1, 2, 3, 4, 5, 0, time.UTC)
	res := orgToResource(&org.Org{
		ID:       7,
		Name:     "Ops",
		Address1: "1 Main",
		City:     "Lisbon",
		Created:  created,
		Updated:  created,
	})

	require.Equal(t, "7", res.Name)
	require.Equal(t, "Ops", res.Spec.Name)
	require.Equal(t, "1 Main", res.Spec.Address1)
	require.Equal(t, "Lisbon", res.Spec.City)
	require.Equal(t, "Organization", res.Kind)
}

func TestMembershipNameRoundTrip(t *testing.T) {
	name := membershipName(3, "user-abc")
	require.Equal(t, "3.user-abc", name)

	orgID, userRef, err := parseMembershipName(name)
	require.NoError(t, err)
	require.Equal(t, int64(3), orgID)
	require.Equal(t, "user-abc", userRef)
}

func TestParseMembershipNameRejectsInvalid(t *testing.T) {
	_, _, err := parseMembershipName("noperiod")
	require.Error(t, err)
	_, _, err = parseMembershipName("abc.user")
	require.Error(t, err)
}

func TestOrgUserToMembership(t *testing.T) {
	res := orgUserToMembership(&org.OrgUserDTO{
		OrgID:  4,
		UserID: 9,
		UID:    "uid-9",
		Role:   "Admin",
	})
	require.Equal(t, "4.uid-9", res.Name)
	require.Equal(t, "4", res.Spec.OrgRef)
	require.Equal(t, "uid-9", res.Spec.UserRef)
	require.Equal(t, "Admin", res.Spec.Role)
}
