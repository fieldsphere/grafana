package pref

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNinetiesThemeIsBuiltIn(t *testing.T) {
	require.True(t, IsValidThemeID("nineties"))

	theme := GetThemeByID("nineties")
	require.NotNil(t, theme)
	require.Equal(t, "dark", theme.Type)
	require.False(t, theme.IsExtra)
}
