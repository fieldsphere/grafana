package v0alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const OpenAPIPrefix = "com.github.grafana.grafana.pkg.apis.org.v0alpha1."

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type Organization struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec OrganizationSpec `json:"spec,omitempty"`
}

func (Organization) OpenAPIModelName() string {
	return OpenAPIPrefix + "Organization"
}

// OrganizationSpec is the tenant record. Address fields match pkg/services/org.Org.
type OrganizationSpec struct {
	Name     string `json:"name"`
	Address1 string `json:"address1,omitempty"`
	Address2 string `json:"address2,omitempty"`
	City     string `json:"city,omitempty"`
	ZipCode  string `json:"zipCode,omitempty"`
	State    string `json:"state,omitempty"`
	Country  string `json:"country,omitempty"`
}

func (OrganizationSpec) OpenAPIModelName() string {
	return OpenAPIPrefix + "OrganizationSpec"
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type OrganizationList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Organization `json:"items"`
}

func (OrganizationList) OpenAPIModelName() string {
	return OpenAPIPrefix + "OrganizationList"
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type OrgMembership struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec OrgMembershipSpec `json:"spec,omitempty"`
}

func (OrgMembership) OpenAPIModelName() string {
	return OpenAPIPrefix + "OrgMembership"
}

// OrgMembershipSpec is a user's role in one organization.
// Invites stay a later Invitation kind; this is membership CRUD only.
type OrgMembershipSpec struct {
	// OrgRef is the numeric organization id (metadata.name of Organization).
	OrgRef string `json:"orgRef"`
	// UserRef is the user's UID.
	UserRef string `json:"userRef"`
	// Role is None, Viewer, Editor, or Admin.
	Role string `json:"role"`
}

func (OrgMembershipSpec) OpenAPIModelName() string {
	return OpenAPIPrefix + "OrgMembershipSpec"
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type OrgMembershipList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []OrgMembership `json:"items"`
}

func (OrgMembershipList) OpenAPIModelName() string {
	return OpenAPIPrefix + "OrgMembershipList"
}
