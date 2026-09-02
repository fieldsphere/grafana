package org

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	orgv0 "github.com/grafana/grafana/pkg/apis/org/v0alpha1"
	"github.com/grafana/grafana/pkg/services/org"
)

func orgToResource(o *org.Org) *orgv0.Organization {
	if o == nil {
		return nil
	}
	return &orgv0.Organization{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Organization",
			APIVersion: orgv0.APIVERSION,
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:              strconv.FormatInt(o.ID, 10),
			CreationTimestamp: metav1.NewTime(o.Created),
			ResourceVersion:   strconv.FormatInt(o.Updated.UnixNano(), 10),
		},
		Spec: orgv0.OrganizationSpec{
			Name:     o.Name,
			Address1: o.Address1,
			Address2: o.Address2,
			City:     o.City,
			ZipCode:  o.ZipCode,
			State:    o.State,
			Country:  o.Country,
		},
	}
}

func orgDTOToResource(o *org.OrgDTO) *orgv0.Organization {
	if o == nil {
		return nil
	}
	return &orgv0.Organization{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Organization",
			APIVersion: orgv0.APIVERSION,
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: strconv.FormatInt(o.ID, 10),
		},
		Spec: orgv0.OrganizationSpec{Name: o.Name},
	}
}

func membershipName(orgID int64, userRef string) string {
	return fmt.Sprintf("%d.%s", orgID, userRef)
}

func parseMembershipName(name string) (int64, string, error) {
	orgStr, userRef, ok := strings.Cut(name, ".")
	if !ok || orgStr == "" || userRef == "" {
		return 0, "", fmt.Errorf("membership name must be {orgId}.{userUID}")
	}
	orgID, err := strconv.ParseInt(orgStr, 10, 64)
	if err != nil {
		return 0, "", fmt.Errorf("membership name must start with a numeric org id")
	}
	return orgID, userRef, nil
}

func orgUserToMembership(dto *org.OrgUserDTO) *orgv0.OrgMembership {
	if dto == nil {
		return nil
	}
	userRef := dto.UID
	if userRef == "" {
		userRef = strconv.FormatInt(dto.UserID, 10)
	}
	created := dto.Created
	if created.IsZero() {
		created = time.Time{}
	}
	return &orgv0.OrgMembership{
		TypeMeta: metav1.TypeMeta{
			Kind:       "OrgMembership",
			APIVersion: orgv0.APIVERSION,
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:              membershipName(dto.OrgID, userRef),
			CreationTimestamp: metav1.NewTime(created),
		},
		Spec: orgv0.OrgMembershipSpec{
			OrgRef:  strconv.FormatInt(dto.OrgID, 10),
			UserRef: userRef,
			Role:    dto.Role,
		},
	}
}

func parseOrgID(name string) (int64, error) {
	id, err := strconv.ParseInt(name, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("organization name must be the numeric org id")
	}
	return id, nil
}
