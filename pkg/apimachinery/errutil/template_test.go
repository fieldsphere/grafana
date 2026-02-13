package errutil_test

import (
	"errors"
	"os"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/apimachinery/errutil"
)

func TestTemplate(t *testing.T) {
	tmpl := errutil.Internal("template.sampleError").MustTemplate("[{{ .Public.user }}] got error: {{ .Error }}")
	err := tmpl.Build(errutil.TemplateData{
		Public: map[string]any{
			"user": "grot the bot",
		},
		Error: errors.New("oh noes"),
	})

	t.Run("Built error should return true when compared with templated error ", func(t *testing.T) {
		require.True(t, errors.Is(err, tmpl))
	})

	t.Run("Built error should return true when compared with templated error base ", func(t *testing.T) {
		require.True(t, errors.Is(err, tmpl.Base))
	})
}

func ExampleTemplate() {
	// Initialization, this is typically done on a package or global
	// level.
	var tmpl = errutil.Internal("template.sampleError").MustTemplate("[{{ .Public.user }}] got error: {{ .Error }}")

	// Construct an error based on the template.
	err := tmpl.Build(errutil.TemplateData{
		Public: map[string]any{
			"user": "grot the bot",
		},
		Error: errors.New("oh noes"),
	})

	_, _ = os.Stdout.WriteString(err.Error() + "\n")

	// Output:
	// [template.sampleError] [grot the bot] got error: oh noes
}

func ExampleTemplate_public() {
	// Initialization, this is typically done on a package or global
	// level.
	var tmpl = errutil.Internal("template.sampleError").MustTemplate(
		"[{{ .Public.user }}] got error: {{ .Error }}",
		errutil.WithPublic("Oh, no, error for {{ .Public.user }}"),
	)

	// Construct an error based on the template.
	//nolint:errorlint
	err := tmpl.Build(errutil.TemplateData{
		Public: map[string]any{
			"user": "grot the bot",
		},
		Error: errors.New("oh noes"),
	}).(errutil.Error)

	_, _ = os.Stdout.WriteString(err.Error() + "\n")
	_, _ = os.Stdout.WriteString(err.PublicMessage + "\n")

	// Output:
	// [template.sampleError] [grot the bot] got error: oh noes
	// Oh, no, error for grot the bot
}
