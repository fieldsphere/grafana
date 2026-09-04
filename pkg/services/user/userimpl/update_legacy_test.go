package userimpl

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/user"
)

func TestMustUseLegacyUserUpdate(t *testing.T) {
	require.False(t, mustUseLegacyUserUpdate(nil))
	require.False(t, mustUseLegacyUserUpdate(&user.UpdateUserCommand{Name: "a"}))

	pass := user.Password("secret")
	require.True(t, mustUseLegacyUserUpdate(&user.UpdateUserCommand{Password: &pass}))

	orgID := int64(3)
	require.True(t, mustUseLegacyUserUpdate(&user.UpdateUserCommand{OrgID: &orgID}))
}
