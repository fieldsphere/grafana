package resource

import (
	"testing"

	"go.opentelemetry.io/otel/attribute"
	"github.com/stretchr/testify/require"
)

func TestTraceMetadataAttribute(t *testing.T) {
	t.Run("returns stable attribute for known metadata", func(t *testing.T) {
		attr, ok := traceMetadataAttribute(grpcMetaKeyCollection, []string{"ns/group/resource"})
		require.True(t, ok)
		require.Equal(t, attribute.StringSlice("bulkCollection", []string{"ns/group/resource"}), attr)

		attr, ok = traceMetadataAttribute(grpcMetaKeySkipValidation, []string{"true"})
		require.True(t, ok)
		require.Equal(t, attribute.StringSlice("bulkSkipValidation", []string{"true"}), attr)
	})

	t.Run("returns false for unknown metadata", func(t *testing.T) {
		_, ok := traceMetadataAttribute("x-gf-unknown", []string{"value"})
		require.False(t, ok)
	})
}
