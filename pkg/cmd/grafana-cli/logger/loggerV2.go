package logger

import (
	"fmt"
	"strings"

	"github.com/fatih/color"
)

type CLILogger struct {
	debugMode bool
}

func New(debugMode bool) *CLILogger {
	return &CLILogger{
		debugMode: debugMode,
	}
}

func (l *CLILogger) Successf(format string, args ...any) {
	fmt.Printf(fmt.Sprintf("%s %s\n\n", color.GreenString("✔"), format), args...)
}

func (l *CLILogger) Failuref(format string, args ...any) {
	fmt.Printf(fmt.Sprintf("%s %s %s\n\n", color.RedString("Error"), color.RedString("✗"), format), args...)
}

func (l *CLILogger) Info(msg string, ctx ...any) {
	if len(ctx) == 0 {
		fmt.Printf("%s\n\n", msg)
		return
	}
	fmt.Printf("%s %v\n\n", msg, formatCtx(ctx))
}

func (l *CLILogger) Infof(format string, args ...any) {
	fmt.Printf(addNewlines(format), args...)
}

func (l *CLILogger) Debug(msg string, ctx ...any) {
	if l.debugMode {
		if len(ctx) == 0 {
			fmt.Print(color.HiBlueString(fmt.Sprintf("%s\n\n", msg)))
			return
		}
		fmt.Print(color.HiBlueString(fmt.Sprintf("%s %v\n\n", msg, formatCtx(ctx))))
	}
}

func (l *CLILogger) Debugf(format string, args ...any) {
	if l.debugMode {
		fmt.Print(color.HiBlueString(fmt.Sprintf(addNewlines(format), args...)))
	}
}

func (l *CLILogger) Warn(msg string, ctx ...any) {
	if len(ctx) == 0 {
		fmt.Printf("%s\n\n", msg)
		return
	}
	fmt.Printf("%s %v\n\n", msg, formatCtx(ctx))
}

func (l *CLILogger) Warnf(format string, args ...any) {
	fmt.Printf(addNewlines(format), args...)
}

func (l *CLILogger) Error(msg string, ctx ...any) {
	if len(ctx) == 0 {
		fmt.Printf("%s\n\n", msg)
		return
	}
	fmt.Printf("%s %v\n\n", msg, formatCtx(ctx))
}

func (l *CLILogger) Errorf(format string, args ...any) {
	fmt.Printf(addNewlines(format), args...)
}

func addNewlines(str string) string {
	var s strings.Builder
	s.WriteString(str)
	s.WriteString("\n\n")

	return s.String()
}

func formatCtx(ctx []any) string {
	if len(ctx) == 0 {
		return ""
	}
	var s strings.Builder
	for i := 0; i < len(ctx); i += 2 {
		if i > 0 {
			s.WriteString(" ")
		}
		key := ctx[i]
		if i+1 < len(ctx) {
			s.WriteString(fmt.Sprintf("%v=%v", key, ctx[i+1]))
		} else {
			s.WriteString(fmt.Sprintf("%v", key))
		}
	}
	return s.String()
}
