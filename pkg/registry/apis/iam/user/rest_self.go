package user

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/ua-parser/uap-go/uaparser"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	iamv0 "github.com/grafana/grafana/apps/iam/pkg/apis/iam/v0alpha1"
	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/services/auth"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
)

type UserContext struct {
	metav1.TypeMeta `json:",inline"`
	OrgID           int64 `json:"orgId"`
}

func (c *UserContext) DeepCopyObject() runtime.Object {
	if c == nil {
		return nil
	}
	out := *c
	return &out
}

type UserPassword struct {
	metav1.TypeMeta `json:",inline"`
	OldPassword     string `json:"oldPassword,omitempty"`
	NewPassword     string `json:"newPassword"`
}

func (p *UserPassword) DeepCopyObject() runtime.Object {
	if p == nil {
		return nil
	}
	out := *p
	return &out
}

type UserSessionList struct {
	metav1.TypeMeta `json:",inline"`
	Items           []UserSession `json:"items"`
}

func (l *UserSessionList) DeepCopyObject() runtime.Object {
	if l == nil {
		return nil
	}
	out := *l
	if l.Items != nil {
		out.Items = append([]UserSession(nil), l.Items...)
	}
	return &out
}

type UserSession struct {
	ID                     int64     `json:"id"`
	IsActive               bool      `json:"isActive"`
	ClientIP               string    `json:"clientIp"`
	Device                 string    `json:"device"`
	OperatingSystem        string    `json:"os"`
	OperatingSystemVersion string    `json:"osVersion"`
	Browser                string    `json:"browser"`
	BrowserVersion         string    `json:"browserVersion"`
	AuthModule             string    `json:"authModule,omitempty"`
	CreatedAt              time.Time `json:"createdAt"`
	SeenAt                 time.Time `json:"seenAt"`
}

type UserContextREST struct {
	users user.Service
	orgs  org.Service
}

func NewUserContextREST(users user.Service, orgs org.Service) *UserContextREST {
	return &UserContextREST{users: users, orgs: orgs}
}

var (
	_ rest.Storage         = (*UserContextREST)(nil)
	_ rest.StorageMetadata = (*UserContextREST)(nil)
	_ rest.Connecter       = (*UserContextREST)(nil)
)

func (s *UserContextREST) New() runtime.Object { return &UserContext{} }
func (s *UserContextREST) Destroy()            {}
func (s *UserContextREST) ProducesMIMETypes(string) []string {
	return []string{"application/json"}
}
func (s *UserContextREST) ProducesObject(string) interface{} { return s.New() }
func (s *UserContextREST) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}
func (s *UserContextREST) ConnectMethods() []string { return []string{http.MethodPost} }

func (s *UserContextREST) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		u, err := s.users.GetByUID(req.Context(), &user.GetUserByUIDQuery{UID: name})
		if err != nil {
			responder.Error(mapUserError(name, err))
			return
		}
		var body UserContext
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			responder.Error(apierrors.NewBadRequest("invalid context body"))
			return
		}
		if body.OrgID == 0 {
			responder.Error(apierrors.NewBadRequest("orgId is required"))
			return
		}
		if !userBelongsToOrg(req.Context(), s.orgs, u.ID, body.OrgID) {
			responder.Error(apierrors.NewUnauthorized("Not a valid organization"))
			return
		}
		if err := s.users.Update(req.Context(), &user.UpdateUserCommand{UserID: u.ID, OrgID: &body.OrgID}); err != nil {
			responder.Error(err)
			return
		}
		responder.Object(http.StatusOK, &UserContext{
			TypeMeta: metav1.TypeMeta{Kind: "UserContext", APIVersion: iamv0.APIVERSION},
			OrgID:    body.OrgID,
		})
	}), nil
}

type UserPasswordREST struct {
	users user.Service
}

func NewUserPasswordREST(users user.Service) *UserPasswordREST {
	return &UserPasswordREST{users: users}
}

var (
	_ rest.Storage         = (*UserPasswordREST)(nil)
	_ rest.StorageMetadata = (*UserPasswordREST)(nil)
	_ rest.Connecter       = (*UserPasswordREST)(nil)
)

func (s *UserPasswordREST) New() runtime.Object { return &UserPassword{} }
func (s *UserPasswordREST) Destroy()            {}
func (s *UserPasswordREST) ProducesMIMETypes(string) []string {
	return []string{"application/json"}
}
func (s *UserPasswordREST) ProducesObject(string) interface{} { return s.New() }
func (s *UserPasswordREST) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}
func (s *UserPasswordREST) ConnectMethods() []string { return []string{http.MethodPut} }

func (s *UserPasswordREST) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		u, err := s.users.GetByUID(req.Context(), &user.GetUserByUIDQuery{UID: name})
		if err != nil {
			responder.Error(mapUserError(name, err))
			return
		}
		var body UserPassword
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			responder.Error(apierrors.NewBadRequest("invalid password body"))
			return
		}
		if body.NewPassword == "" {
			responder.Error(apierrors.NewBadRequest("newPassword is required"))
			return
		}
		newPass := user.Password(body.NewPassword)
		oldPass := user.Password(body.OldPassword)
		if err := s.users.Update(req.Context(), &user.UpdateUserCommand{
			UserID:      u.ID,
			Password:    &newPass,
			OldPassword: &oldPass,
		}); err != nil {
			responder.Error(err)
			return
		}
		responder.Object(http.StatusOK, &metav1.Status{Status: metav1.StatusSuccess})
	}), nil
}

type UserSessionsREST struct {
	users  user.Service
	tokens auth.UserTokenService
}

func NewUserSessionsREST(users user.Service, tokens auth.UserTokenService) *UserSessionsREST {
	return &UserSessionsREST{users: users, tokens: tokens}
}

var (
	_ rest.Storage         = (*UserSessionsREST)(nil)
	_ rest.StorageMetadata = (*UserSessionsREST)(nil)
	_ rest.Connecter       = (*UserSessionsREST)(nil)
)

func (s *UserSessionsREST) New() runtime.Object { return &UserSessionList{} }
func (s *UserSessionsREST) Destroy()            {}
func (s *UserSessionsREST) ProducesMIMETypes(string) []string {
	return []string{"application/json"}
}
func (s *UserSessionsREST) ProducesObject(string) interface{} { return s.New() }
func (s *UserSessionsREST) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}
func (s *UserSessionsREST) ConnectMethods() []string {
	return []string{http.MethodGet, http.MethodDelete}
}

func (s *UserSessionsREST) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		u, err := s.users.GetByUID(req.Context(), &user.GetUserByUIDQuery{UID: name})
		if err != nil {
			responder.Error(mapUserError(name, err))
			return
		}
		switch req.Method {
		case http.MethodGet:
			tokens, err := s.tokens.GetUserTokens(req.Context(), u.ID)
			if err != nil {
				responder.Error(err)
				return
			}
			activeID := currentSessionID(req.Context())
			items := make([]UserSession, 0, len(tokens))
			for _, tok := range tokens {
				if tok == nil {
					continue
				}
				items = append(items, mapUserSession(req.Context(), s.tokens, tok, activeID))
			}
			responder.Object(http.StatusOK, &UserSessionList{
				TypeMeta: metav1.TypeMeta{Kind: "UserSessionList", APIVersion: iamv0.APIVERSION},
				Items:    items,
			})
		case http.MethodDelete:
			id, _ := strconv.ParseInt(req.URL.Query().Get("authTokenId"), 10, 64)
			if id == 0 {
				var body struct {
					AuthTokenID int64 `json:"authTokenId"`
				}
				_ = json.NewDecoder(req.Body).Decode(&body)
				id = body.AuthTokenID
			}
			if id == 0 {
				responder.Error(apierrors.NewBadRequest("authTokenId is required"))
				return
			}
			tok, err := s.tokens.GetUserToken(req.Context(), u.ID, id)
			if err != nil {
				responder.Error(err)
				return
			}
			if err := s.tokens.RevokeToken(req.Context(), tok, true); err != nil {
				responder.Error(err)
				return
			}
			responder.Object(http.StatusOK, &metav1.Status{Status: metav1.StatusSuccess})
		default:
			responder.Error(apierrors.NewMethodNotSupported(iamv0.UserResourceInfo.GroupResource(), req.Method))
		}
	}), nil
}

func mapUserError(name string, err error) error {
	if err == user.ErrUserNotFound {
		return apierrors.NewNotFound(iamv0.UserResourceInfo.GroupResource(), name)
	}
	return err
}

func userBelongsToOrg(ctx context.Context, orgs org.Service, userID, orgID int64) bool {
	if orgs == nil {
		return false
	}
	result, err := orgs.GetUserOrgList(ctx, &org.GetUserOrgListQuery{UserID: userID})
	if err != nil {
		return false
	}
	for _, other := range result {
		if other.OrgID == orgID {
			return true
		}
	}
	return false
}

func currentSessionID(ctx context.Context) int64 {
	u, err := identity.GetRequester(ctx)
	if err != nil {
		return 0
	}
	id, ok := u.(*authn.Identity)
	if !ok || id.SessionToken == nil {
		return 0
	}
	return id.SessionToken.Id
}

func mapUserSession(ctx context.Context, tokens auth.UserTokenService, tok *auth.UserToken, activeID int64) UserSession {
	parser := uaparser.NewFromSaved()
	client := parser.Parse(tok.UserAgent)

	osVersion := ""
	if client.Os.Major != "" {
		osVersion = client.Os.Major
		if client.Os.Minor != "" {
			osVersion = osVersion + "." + client.Os.Minor
		}
	}
	browserVersion := ""
	if client.UserAgent.Major != "" {
		browserVersion = client.UserAgent.Major
		if client.UserAgent.Minor != "" {
			browserVersion = browserVersion + "." + client.UserAgent.Minor
		}
	}

	createdAt := time.Unix(tok.CreatedAt, 0)
	seenAt := time.Unix(tok.SeenAt, 0)
	if tok.SeenAt == 0 {
		seenAt = createdAt
	}

	authModule := ""
	if tokens != nil && tok.ExternalSessionId != 0 {
		if externalSession, err := tokens.GetExternalSession(ctx, tok.ExternalSessionId); err == nil {
			authModule = login.GetAuthProviderLabel(externalSession.AuthModule)
		}
	}

	return UserSession{
		ID:                     tok.Id,
		IsActive:               activeID != 0 && tok.Id == activeID,
		ClientIP:               tok.ClientIp,
		Device:                 client.Device.ToString(),
		OperatingSystem:        client.Os.Family,
		OperatingSystemVersion: osVersion,
		Browser:                client.UserAgent.Family,
		BrowserVersion:         browserVersion,
		AuthModule:             authModule,
		CreatedAt:              createdAt,
		SeenAt:                 seenAt,
	}
}
