package user

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	claims "github.com/grafana/authlib/types"
	"github.com/ua-parser/uap-go/uaparser"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	legacyiamv0 "github.com/grafana/grafana/pkg/apis/iam/v0alpha1"
	"github.com/grafana/grafana/pkg/services/auth"
	"github.com/grafana/grafana/pkg/services/contexthandler"
	"github.com/grafana/grafana/pkg/services/login"
)

var (
	_ rest.Storage         = (*UserTokenREST)(nil)
	_ rest.StorageMetadata = (*UserTokenREST)(nil)
	_ rest.Connecter       = (*UserTokenREST)(nil)
)

// UserTokenREST serves GET/POST users/{name}/tokens for session auth-token list/revoke.
// Cookie rotate stays on /api/user/auth-tokens/rotate.
type UserTokenREST struct {
	userGetter       rest.Getter
	authTokenService auth.UserTokenService
}

func NewUserTokenREST(userGetter rest.Getter, authTokenService auth.UserTokenService) *UserTokenREST {
	return &UserTokenREST{userGetter: userGetter, authTokenService: authTokenService}
}

func (s *UserTokenREST) New() runtime.Object {
	return &legacyiamv0.UserAuthTokenList{}
}

func (s *UserTokenREST) Destroy() {}

func (s *UserTokenREST) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (s *UserTokenREST) ProducesObject(verb string) interface{} {
	switch verb {
	case "POST":
		return &legacyiamv0.UserAuthTokenRevokeStatus{}
	default:
		return &legacyiamv0.UserAuthTokenList{}
	}
}

func (s *UserTokenREST) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requester, err := identity.GetRequester(r.Context())
		if err != nil || !claims.IsIdentityType(requester.GetIdentityType(), claims.TypeUser) {
			responder.Error(apierrors.NewForbidden(legacyiamv0.Resource("users"), name, errors.New("entity not allowed to manage tokens")))
			return
		}

		userID, err := resolveUserInternalID(r.Context(), s.userGetter, name)
		if err != nil {
			responder.Error(err)
			return
		}

		callerID, err := requester.GetInternalID()
		if err != nil || callerID != userID {
			responder.Error(apierrors.NewForbidden(legacyiamv0.Resource("users"), name, errors.New("can only manage own auth tokens")))
			return
		}

		switch r.Method {
		case http.MethodGet:
			s.listTokens(r, userID, responder)
		case http.MethodPost:
			s.revokeToken(r, userID, responder)
		default:
			responder.Error(apierrors.NewMethodNotSupported(legacyiamv0.Resource("users"), r.Method))
		}
	}), nil
}

func (s *UserTokenREST) listTokens(r *http.Request, userID int64, responder rest.Responder) {
	tokens, err := s.authTokenService.GetUserTokens(r.Context(), userID)
	if err != nil {
		responder.Error(apierrors.NewInternalError(err))
		return
	}

	parser := uaparser.NewFromSaved()
	currentTokenID := currentSessionTokenID(r.Context())
	items := make([]legacyiamv0.UserAuthToken, 0, len(tokens))
	for _, token := range tokens {
		createdAt := time.Unix(token.CreatedAt, 0).Format(time.RFC3339)
		seenAt := createdAt
		if token.SeenAt != 0 {
			seenAt = time.Unix(token.SeenAt, 0).Format(time.RFC3339)
		}

		client := parser.Parse(token.UserAgent)
		authModule := ""
		if token.ExternalSessionId != 0 {
			if externalSession, err := s.authTokenService.GetExternalSession(r.Context(), token.ExternalSessionId); err == nil {
				authModule = login.GetAuthProviderLabel(externalSession.AuthModule)
			}
		}

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

		items = append(items, legacyiamv0.UserAuthToken{
			ID:             token.Id,
			CreatedAt:      createdAt,
			SeenAt:         seenAt,
			ClientIP:       token.ClientIp,
			UserAgent:      client.UserAgent.Family + " on " + client.Os.Family,
			AuthModule:     authModule,
			IsActive:       currentTokenID != 0 && currentTokenID == token.Id,
			Browser:        client.UserAgent.Family,
			BrowserVersion: browserVersion,
			OS:             client.Os.Family,
			OSVersion:      osVersion,
			Device:         client.Device.ToString(),
		})
	}

	responder.Object(http.StatusOK, &legacyiamv0.UserAuthTokenList{Items: items})
}

func (s *UserTokenREST) revokeToken(r *http.Request, userID int64, responder rest.Responder) {
	var cmd auth.RevokeAuthTokenCmd
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		responder.Error(apierrors.NewBadRequest("bad request data"))
		return
	}

	token, err := s.authTokenService.GetUserToken(r.Context(), userID, cmd.AuthTokenId)
	if err != nil {
		if errors.Is(err, auth.ErrUserTokenNotFound) {
			responder.Error(apierrors.NewNotFound(legacyiamv0.Resource("users"), "token"))
			return
		}
		responder.Error(apierrors.NewInternalError(err))
		return
	}

	if err := s.authTokenService.RevokeToken(r.Context(), token, false); err != nil {
		responder.Error(apierrors.NewInternalError(err))
		return
	}

	responder.Object(http.StatusOK, &legacyiamv0.UserAuthTokenRevokeStatus{Message: "User auth token revoked"})
}

func currentSessionTokenID(ctx context.Context) int64 {
	reqCtx := contexthandler.FromContext(ctx)
	if reqCtx == nil || reqCtx.UserToken == nil {
		return 0
	}
	return reqCtx.UserToken.Id
}

func (s *UserTokenREST) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}

func (s *UserTokenREST) ConnectMethods() []string {
	return []string{http.MethodGet, http.MethodPost}
}
