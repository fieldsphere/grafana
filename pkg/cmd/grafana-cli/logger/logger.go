package logger

import (
	"fmt"
	"strings"
)

var (
	debugmode = false
)

func Debug(msg string, ctx ...any) {
	if debugmode {
		if len(ctx) == 0 {
			fmt.Println(msg)
			return
		}
		fmt.Printf("%s %s\n", msg, formatKeyValues(ctx))
	}
}

func Debugf(fmtString string, args ...any) {
	if debugmode {
		fmt.Printf(addMissingNewline(fmtString), args...)
	}
}

func Error(msg string, ctx ...any) {
	if len(ctx) == 0 {
		fmt.Println(msg)
		return
	}
	fmt.Printf("%s %s\n", msg, formatKeyValues(ctx))
}

func Errorf(fmtString string, args ...any) {
	fmt.Printf(addMissingNewline(fmtString), args...)
}

func Info(msg string, ctx ...any) {
	if len(ctx) == 0 {
		fmt.Println(msg)
		return
	}
	fmt.Printf("%s %s\n", msg, formatKeyValues(ctx))
}

func Infof(fmtString string, args ...any) {
	fmt.Printf(addMissingNewline(fmtString), args...)
}

func Warn(msg string, ctx ...any) {
	if len(ctx) == 0 {
		fmt.Println(msg)
		return
	}
	fmt.Printf("%s %s\n", msg, formatKeyValues(ctx))
}

func Warnf(fmtString string, args ...any) {
	fmt.Printf(addMissingNewline(fmtString), args...)
}

func SetDebug(value bool) {
	debugmode = value
}

func addMissingNewline(s string) string {
	if strings.HasSuffix(s, "\n") {
		return s
	}

	return s + "\n"
}

func formatKeyValues(ctx []any) string {
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
