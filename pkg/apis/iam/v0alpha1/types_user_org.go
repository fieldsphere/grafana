package v0alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type UserOrgList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []UserOrg `json:"items"`
}

type UserOrg struct {
	OrgID int64  `json:"orgId"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type UserAuthTokenList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []UserAuthToken `json:"items"`
}

type UserAuthToken struct {
	ID        int64  `json:"id"`
	CreatedAt string `json:"createdAt,omitempty"`
	SeenAt    string `json:"seenAt,omitempty"`
	ClientIP  string `json:"clientIp,omitempty"`
	UserAgent string `json:"userAgent,omitempty"`
	AuthModule string `json:"authModule,omitempty"`
	IsActive  bool   `json:"isActive"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type UserAuthTokenRevokeStatus struct {
	metav1.TypeMeta `json:",inline"`

	Message string `json:"message"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type UserUsingStatus struct {
	metav1.TypeMeta `json:",inline"`

	Message string `json:"message"`
	OrgID   int64  `json:"orgId,omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type UserPasswordStatus struct {
	metav1.TypeMeta `json:",inline"`

	Message string `json:"message"`
}
