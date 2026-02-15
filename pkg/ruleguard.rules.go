//go:build ignore
// +build ignore

// The MIT License (MIT)
//
// Copyright (c) 2020 Grafana Labs <contact@grafana.com>, Damian Gryski <damian@gryski.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

package gorules

import "github.com/quasilyte/go-ruleguard/dsl/fluent"

// This is a collection of rules for ruleguard: https://github.com/quasilyte/go-ruleguard
// Copied from https://github.com/dgryski/semgrep-go

// Remove extra conversions: mdempsky/unconvert
func unconvert(m fluent.Matcher) {
	m.Match("int($x)").Where(m["x"].Type.Is("int") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")

	m.Match("float32($x)").Where(m["x"].Type.Is("float32") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")
	m.Match("float64($x)").Where(m["x"].Type.Is("float64") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")

	m.Match("byte($x)").Where(m["x"].Type.Is("byte")).Report("unnecessary conversion").Suggest("$x")
	m.Match("rune($x)").Where(m["x"].Type.Is("rune")).Report("unnecessary conversion").Suggest("$x")
	m.Match("bool($x)").Where(m["x"].Type.Is("bool") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")

	m.Match("int8($x)").Where(m["x"].Type.Is("int8") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")
	m.Match("int16($x)").Where(m["x"].Type.Is("int16") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")
	m.Match("int32($x)").Where(m["x"].Type.Is("int32") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")
	m.Match("int64($x)").Where(m["x"].Type.Is("int64") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")

	m.Match("uint8($x)").Where(m["x"].Type.Is("uint8") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")
	m.Match("uint16($x)").Where(m["x"].Type.Is("uint16") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")
	m.Match("uint32($x)").Where(m["x"].Type.Is("uint32") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")
	m.Match("uint64($x)").Where(m["x"].Type.Is("uint64") && !m["x"].Const).Report("unnecessary conversion").Suggest("$x")

	m.Match("time.Duration($x)").Where(m["x"].Type.Is("time.Duration") && !m["x"].Text.Matches("^[0-9]*$")).Report("unnecessary conversion").Suggest("$x")
}

// Don't use == or != with time.Time
// https://github.com/dominikh/go-tools/issues/47 : Wontfix
func timeeq(m fluent.Matcher) {
	m.Match("$t0 == $t1").Where(m["t0"].Type.Is("time.Time")).Report("using == with time.Time")
	m.Match("$t0 != $t1").Where(m["t0"].Type.Is("time.Time")).Report("using != with time.Time")
	m.Match(`map[$k]$v`).Where(m["k"].Type.Is("time.Time")).Report("map with time.Time keys are easy to misuse")
}

// Wrong err in error check
func wrongerr(m fluent.Matcher) {
	m.Match("if $*_, $err0 := $*_; $err1 != nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("if $*_, $err0 := $*_; $err1 != nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("if $*_, $err0 = $*_; $err1 != nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("if $*_, $err0 = $*_; $err1 != nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("if $*_, $err0 := $*_; $err1 == nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("if $*_, $err0 := $*_; $err1 == nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("if $*_, $err0 = $*_; $err1 == nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("if $*_, $err0 = $*_; $err1 == nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 := $*_; if $err1 != nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 := $*_; if $err1 != nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 := $*_; if $err1 == nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 := $*_; if $err1 == nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 = $*_; if $err1 != nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 = $*_; if $err1 != nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 = $*_; if $err1 == nil { $*_ }").
		Where(m["err0"].Text == "err" && m["err0"].Type.Is("error") && m["err1"].Text != "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")

	m.Match("$*_, $err0 = $*_; if $err1 == nil { $*_ }").
		Where(m["err0"].Text != "err" && m["err0"].Type.Is("error") && m["err1"].Text == "err" && m["err1"].Type.Is("error")).
		Report("maybe wrong err in error check")
}

// err but no an error
func errnoterror(m fluent.Matcher) {

	// Would be easier to check for all err identifiers instead, but then how do we get the type from m[] ?

	m.Match(
		"if $*_, err := $x; $err != nil { $*_ } else if $_ { $*_ }",
		"if $*_, err := $x; $err != nil { $*_ } else { $*_ }",
		"if $*_, err := $x; $err != nil { $*_ }",

		"if $*_, err = $x; $err != nil { $*_ } else if $_ { $*_ }",
		"if $*_, err = $x; $err != nil { $*_ } else { $*_ }",
		"if $*_, err = $x; $err != nil { $*_ }",

		"$*_, err := $x; if $err != nil { $*_ } else if $_ { $*_ }",
		"$*_, err := $x; if $err != nil { $*_ } else { $*_ }",
		"$*_, err := $x; if $err != nil { $*_ }",

		"$*_, err = $x; if $err != nil { $*_ } else if $_ { $*_ }",
		"$*_, err = $x; if $err != nil { $*_ } else { $*_ }",
		"$*_, err = $x; if $err != nil { $*_ }",
	).
		Where(m["err"].Text == "err" && !m["err"].Type.Is("error") && m["x"].Text != "recover()").
		Report("err variable not error type")
}

// Identical if and else bodies
func ifbodythenbody(m fluent.Matcher) {
	m.Match("if $*_ { $body } else { $body }").
		Report("identical if and else bodies")

	// Lots of false positives.
	// m.Match("if $*_ { $body } else if $*_ { $body }").
	//	Report("identical if and else bodies")
}

// Odd inequality: A - B < 0 instead of !=
// Too many false positives.
/*
func subtractnoteq(m fluent.Matcher) {
	m.Match("$a - $b < 0").Report("consider $a != $b")
	m.Match("$a - $b > 0").Report("consider $a != $b")
	m.Match("0 < $a - $b").Report("consider $a != $b")
	m.Match("0 > $a - $b").Report("consider $a != $b")
}
*/

// Self-assignment
func selfassign(m fluent.Matcher) {
	m.Match("$x = $x").Report("useless self-assignment")
}

// Odd nested ifs
func oddnestedif(m fluent.Matcher) {
	m.Match("if $x { if $x { $*_ }; $*_ }",
		"if $x == $y { if $x != $y {$*_ }; $*_ }",
		"if $x != $y { if $x == $y {$*_ }; $*_ }",
		"if $x { if !$x { $*_ }; $*_ }",
		"if !$x { if $x { $*_ }; $*_ }").
		Report("odd nested ifs")

	m.Match("for $x { if $x { $*_ }; $*_ }",
		"for $x == $y { if $x != $y {$*_ }; $*_ }",
		"for $x != $y { if $x == $y {$*_ }; $*_ }",
		"for $x { if !$x { $*_ }; $*_ }",
		"for !$x { if $x { $*_ }; $*_ }").
		Report("odd nested for/ifs")
}

// odd bitwise expressions
func oddbitwise(m fluent.Matcher) {
	m.Match("$x | $x",
		"$x | ^$x",
		"^$x | $x").
		Report("odd bitwise OR")

	m.Match("$x & $x",
		"$x & ^$x",
		"^$x & $x").
		Report("odd bitwise AND")

	m.Match("$x &^ $x").
		Report("odd bitwise AND-NOT")
}

// odd sequence of if tests with return
func ifreturn(m fluent.Matcher) {
	m.Match("if $x { return $*_ }; if $x {$*_ }").Report("odd sequence of if test")
	m.Match("if $x { return $*_ }; if !$x {$*_ }").Report("odd sequence of if test")
	m.Match("if !$x { return $*_ }; if $x {$*_ }").Report("odd sequence of if test")
	m.Match("if $x == $y { return $*_ }; if $x != $y {$*_ }").Report("odd sequence of if test")
	m.Match("if $x != $y { return $*_ }; if $x == $y {$*_ }").Report("odd sequence of if test")

}

func oddifsequence(m fluent.Matcher) {
	m.Match("if $x { $*_ }; if $x {$*_ }").Report("odd sequence of if test")

	m.Match("if $x == $y { $*_ }; if $y == $x {$*_ }").Report("odd sequence of if tests")
	m.Match("if $x != $y { $*_ }; if $y != $x {$*_ }").Report("odd sequence of if tests")

	m.Match("if $x < $y { $*_ }; if $y > $x {$*_ }").Report("odd sequence of if tests")
	m.Match("if $x <= $y { $*_ }; if $y >= $x {$*_ }").Report("odd sequence of if tests")

	m.Match("if $x > $y { $*_ }; if $y < $x {$*_ }").Report("odd sequence of if tests")
	m.Match("if $x >= $y { $*_ }; if $y <= $x {$*_ }").Report("odd sequence of if tests")
}

// odd sequence of nested if tests
func nestedifsequence(m fluent.Matcher) {
	m.Match("if $x < $y { if $x >= $y {$*_ }; $*_ }").Report("odd sequence of nested if tests")
	m.Match("if $x <= $y { if $x > $y {$*_ }; $*_ }").Report("odd sequence of nested if tests")
	m.Match("if $x > $y { if $x <= $y {$*_ }; $*_ }").Report("odd sequence of nested if tests")
	m.Match("if $x >= $y { if $x < $y {$*_ }; $*_ }").Report("odd sequence of nested if tests")
}

// odd sequence of assignments
func identicalassignments(m fluent.Matcher) {
	m.Match("$x  = $y; $y = $x").Report("odd sequence of assignments")
}

func oddcompoundop(m fluent.Matcher) {
	m.Match("$x += $x + $_",
		"$x += $x - $_").
		Report("odd += expression")

	m.Match("$x -= $x + $_",
		"$x -= $x - $_").
		Report("odd -= expression")
}

func constswitch(m fluent.Matcher) {
	m.Match("switch $x { $*_ }", "switch $*_; $x { $*_ }").
		Where(m["x"].Const && !m["x"].Text.Matches(`^runtime\.`)).
		Report("constant switch")
}

func oddcomparisons(m fluent.Matcher) {
	m.Match(
		"$x - $y == 0",
		"$x - $y != 0",
		"$x - $y < 0",
		"$x - $y <= 0",
		"$x - $y > 0",
		"$x - $y >= 0",
		"$x ^ $y == 0",
		"$x ^ $y != 0",
	).Report("odd comparison")
}

func oddmathbits(m fluent.Matcher) {
	m.Match(
		"64 - bits.LeadingZeros64($x)",
		"32 - bits.LeadingZeros32($x)",
		"16 - bits.LeadingZeros16($x)",
		"8 - bits.LeadingZeros8($x)",
	).Report("odd math/bits expression: use bits.Len*() instead?")
}

/*
func floateq(m fluent.Matcher) {
	m.Match(
		"$x == $y",
		"$x != $y",
	).
		Where(m["x"].Type.Is("float32") && !m["x"].Const && !m["y"].Text.Matches("0(.0+)?")).
		Report("floating point tested for equality")

	m.Match(
		"$x == $y",
		"$x != $y",
	).
		Where(m["x"].Type.Is("float64") && !m["x"].Const && !m["y"].Text.Matches("0(.0+)?")).
		Report("floating point tested for equality")

	m.Match("switch $x { $*_ }", "switch $*_; $x { $*_ }").
		Where(m["x"].Type.Is("float32")).
		Report("floating point as switch expression")

	m.Match("switch $x { $*_ }", "switch $*_; $x { $*_ }").
		Where(m["x"].Type.Is("float64")).
		Report("floating point as switch expression")
}
*/

func badexponent(m fluent.Matcher) {
	m.Match(
		"2 ^ $x",
		"10 ^ $x",
	).
		Report("caret (^) is not exponentiation")
}

/*
func floatloop(m fluent.Matcher) {
	m.Match(
		"for $i := $x; $i < $y; $i += $z { $*_ }",
		"for $i = $x; $i < $y; $i += $z { $*_ }",
	).
		Where(m["i"].Type.Is("float64")).
		Report("floating point for loop counter")

	m.Match(
		"for $i := $x; $i < $y; $i += $z { $*_ }",
		"for $i = $x; $i < $y; $i += $z { $*_ }",
	).
		Where(m["i"].Type.Is("float32")).
		Report("floating point for loop counter")
}
*/

func urlredacted(m fluent.Matcher) {

	m.Match(
		"log.Println($x, $*_)",
		"log.Println($*_, $x, $*_)",
		"log.Println($*_, $x)",
		"log.Printf($*_, $x, $*_)",
		"log.Printf($*_, $x)",
	).
		Where(m["x"].Type.Is("*url.URL")).
		Report("consider $x.Redacted() when outputting URLs")
}

func sprinterr(m fluent.Matcher) {
	m.Match(`fmt.Sprint($err)`,
		`fmt.Sprintf("%s", $err)`,
		`fmt.Sprintf("%v", $err)`,
	).
		Where(m["err"].Type.Is("error")).
		Report("maybe call $err.Error() instead of fmt.Sprint()?")

}

func largeloopcopy(m fluent.Matcher) {
	m.Match(
		`for $_, $v := range $_ { $*_ }`,
	).
		Where(m["v"].Type.Size > 512).
		Report(`loop copies large value each iteration`)
}

func joinpath(m fluent.Matcher) {
	m.Match(
		`strings.Join($_, "/")`,
		`strings.Join($_, "\\")`,
		"strings.Join($_, `\\`)",
	).
		Report(`did you mean path.Join() or filepath.Join() ?`)
}

func readfull(m fluent.Matcher) {
	m.Match(`$n, $err := io.ReadFull($_, $slice)
                 if $err != nil || $n != len($slice) {
                              $*_
		 }`,
		`$n, $err := io.ReadFull($_, $slice)
                 if $n != len($slice) || $err != nil {
                              $*_
		 }`,
		`$n, $err = io.ReadFull($_, $slice)
                 if $err != nil || $n != len($slice) {
                              $*_
		 }`,
		`$n, $err = io.ReadFull($_, $slice)
                 if $n != len($slice) || $err != nil {
                              $*_
		 }`,
		`if $n, $err := io.ReadFull($_, $slice); $n != len($slice) || $err != nil {
                              $*_
		 }`,
		`if $n, $err := io.ReadFull($_, $slice); $err != nil || $n != len($slice) {
                              $*_
		 }`,
		`if $n, $err = io.ReadFull($_, $slice); $n != len($slice) || $err != nil {
                              $*_
		 }`,
		`if $n, $err = io.ReadFull($_, $slice); $err != nil || $n != len($slice) {
                              $*_
		 }`,
	).Report("io.ReadFull() returns err == nil iff n == len(slice)")
}

func nilerr(m fluent.Matcher) {
	m.Match(
		`if err == nil { return err }`,
		`if err == nil { return $*_, err }`,
	).
		Report(`return nil error instead of nil value`)

}

func mailaddress(m fluent.Matcher) {
	m.Match(
		"fmt.Sprintf(`\"%s\" <%s>`, $NAME, $EMAIL)",
		"fmt.Sprintf(`\"%s\"<%s>`, $NAME, $EMAIL)",
		"fmt.Sprintf(`%s <%s>`, $NAME, $EMAIL)",
		"fmt.Sprintf(`%s<%s>`, $NAME, $EMAIL)",
		`fmt.Sprintf("\"%s\"<%s>", $NAME, $EMAIL)`,
		`fmt.Sprintf("\"%s\" <%s>", $NAME, $EMAIL)`,
		`fmt.Sprintf("%s<%s>", $NAME, $EMAIL)`,
		`fmt.Sprintf("%s <%s>", $NAME, $EMAIL)`,
	).
		Report("use net/mail Address.String() instead of fmt.Sprintf()").
		Suggest("(&mail.Address{Name:$NAME, Address:$EMAIL}).String()")
}

func errnetclosed(m fluent.Matcher) {
	m.Match(
		`strings.Contains($err.Error(), $text)`,
	).
		Where(m["text"].Text.Matches("\".*closed network connection.*\"")).
		Report(`String matching against error texts is fragile; use net.ErrClosed instead`).
		Suggest(`errors.Is($err, net.ErrClosed)`)

}

func httpheaderadd(m fluent.Matcher) {
	m.Match(
		`$H.Add($KEY, $VALUE)`,
	).
		Where(m["H"].Type.Is("http.Header")).
		Report("use http.Header.Set method instead of Add to overwrite all existing header values").
		Suggest(`$H.Set($KEY, $VALUE)`)
}

func hmacnew(m fluent.Matcher) {
	m.Match("hmac.New(func() hash.Hash { return $x }, $_)",
		`$f := func() hash.Hash { return $x }
	$*_
	hmac.New($f, $_)`,
	).Where(m["x"].Pure).
		Report("invalid hash passed to hmac.New()")
}

func readeof(m fluent.Matcher) {
	m.Match(
		`$n, $err = $r.Read($_)
	if $err != nil {
	    return $*_
	}`,
		`$n, $err := $r.Read($_)
	if $err != nil {
	    return $*_
	}`).Where(m["r"].Type.Implements("io.Reader")).
		Report("Read() can return n bytes and io.EOF")
}

func writestring(m fluent.Matcher) {
	m.Match(`io.WriteString($w, string($b))`).
		Where(m["b"].Type.Is("[]byte")).
		Suggest("$w.Write($b)")
}

func structuredlogging(m fluent.Matcher) {
	isStructuredLogger := m["logger"].Type.Implements("github.com/grafana/grafana/pkg/infra/log.Logger") ||
		m["logger"].Type.Implements("github.com/grafana/grafana/pkg/plugins/log.Logger") ||
		m["logger"].Type.Implements("github.com/grafana/grafana-app-sdk/logging.Logger") ||
		m["logger"].Type.Implements("github.com/grafana/grafana/pkg/util/xorm/core.ILogger") ||
		m["logger"].Type.Implements("github.com/grafana/grafana-plugin-sdk-go/backend/log.Logger") ||
		m["logger"].Type.Implements("github.com/grafana/grafana-plugin-sdk-go/backend.Logger") ||
		m["logger"].Type.Is("*log/slog.Logger") ||
		m["logger"].Type.Is("log/slog.Logger")
	isSlogLogger := m["logger"].Type.Is("*log/slog.Logger") ||
		m["logger"].Type.Is("log/slog.Logger")

	m.Match(
		`$logger.Info(fmt.Sprintf($fmt, $*args))`,
		`$logger.Warn(fmt.Sprintf($fmt, $*args))`,
		`$logger.Error(fmt.Sprintf($fmt, $*args))`,
		`$logger.Debug(fmt.Sprintf($fmt, $*args))`,
		`$logger.Info(fmt.Sprint($*args))`,
		`$logger.Warn(fmt.Sprint($*args))`,
		`$logger.Error(fmt.Sprint($*args))`,
		`$logger.Debug(fmt.Sprint($*args))`,
	).
		Where(isStructuredLogger).
		Report("use a static log message and key/value context instead of fmt formatting")

	m.Match(
		`$logger.Info($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.Warn($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.Error($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.Debug($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.Info($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.Warn($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.Error($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.Debug($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
	).
		Where(isStructuredLogger).
		Report("avoid fmt formatting in structured log field values; pass typed values or separate fields")

	m.Match(
		`$logger.Info($msg, $*before, $key, $left + $right, $*after)`,
		`$logger.Warn($msg, $*before, $key, $left + $right, $*after)`,
		`$logger.Error($msg, $*before, $key, $left + $right, $*after)`,
		`$logger.Debug($msg, $*before, $key, $left + $right, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $left + $right, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $left + $right, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $left + $right, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $left + $right, $*after)`,
	).
		Where(isStructuredLogger && m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report("avoid string concatenation in structured log field values; pass typed values or separate fields")

	m.Match(
		`slog.Info($msg, $*before, $key, $left + $right, $*after)`,
		`slog.Warn($msg, $*before, $key, $left + $right, $*after)`,
		`slog.Error($msg, $*before, $key, $left + $right, $*after)`,
		`slog.Debug($msg, $*before, $key, $left + $right, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $left + $right, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $left + $right, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $left + $right, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $left + $right, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $left + $right, $*after)`,
		`klog.InfoS($msg, $*before, $key, $left + $right, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $left + $right, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $left + $right, $*after)`,
	).
		Where(m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report("avoid string concatenation in structured log field values; pass typed values or separate fields")

	m.Match(
		`$logger.Info($msg, $*args)`,
		`$logger.Warn($msg, $*args)`,
		`$logger.Error($msg, $*args)`,
		`$logger.Debug($msg, $*args)`,
	).
		Where(isStructuredLogger && m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in structured logger methods; move dynamic values to key/value fields")

	m.Match(
		`$logger.Info($left + $right, $*args)`,
		`$logger.Warn($left + $right, $*args)`,
		`$logger.Error($left + $right, $*args)`,
		`$logger.Debug($left + $right, $*args)`,
	).
		Where(isStructuredLogger).
		Report("avoid string concatenation in structured log messages; use key/value fields")

	m.Match(
		`$logger.Info($msg, $*args)`,
		`$logger.Warn($msg, $*args)`,
		`$logger.Error($msg, $*args)`,
		`$logger.Debug($msg, $*args)`,
	).
		Where(isStructuredLogger && !m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal log message; move dynamic text into key/value fields")

	m.Match(
		`$logger.InfoCtx($ctx, fmt.Sprintf($fmt, $*args), $*fields)`,
		`$logger.WarnCtx($ctx, fmt.Sprintf($fmt, $*args), $*fields)`,
		`$logger.ErrorCtx($ctx, fmt.Sprintf($fmt, $*args), $*fields)`,
		`$logger.DebugCtx($ctx, fmt.Sprintf($fmt, $*args), $*fields)`,
		`$logger.InfoCtx($ctx, fmt.Sprint($*args), $*fields)`,
		`$logger.WarnCtx($ctx, fmt.Sprint($*args), $*fields)`,
		`$logger.ErrorCtx($ctx, fmt.Sprint($*args), $*fields)`,
		`$logger.DebugCtx($ctx, fmt.Sprint($*args), $*fields)`,
	).
		Where(isStructuredLogger).
		Report("use a static log message and key/value context instead of fmt formatting")

	m.Match(
		`$logger.InfoCtx($ctx, $msg, $*fields)`,
		`$logger.WarnCtx($ctx, $msg, $*fields)`,
		`$logger.ErrorCtx($ctx, $msg, $*fields)`,
		`$logger.DebugCtx($ctx, $msg, $*fields)`,
	).
		Where(isStructuredLogger && m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in structured logger context methods; move dynamic values to key/value fields")

	m.Match(
		`$logger.InfoCtx($ctx, $left + $right, $*fields)`,
		`$logger.WarnCtx($ctx, $left + $right, $*fields)`,
		`$logger.ErrorCtx($ctx, $left + $right, $*fields)`,
		`$logger.DebugCtx($ctx, $left + $right, $*fields)`,
	).
		Where(isStructuredLogger).
		Report("avoid string concatenation in structured logger context methods; use key/value fields")

	m.Match(
		`$logger.InfoCtx($ctx, $msg, $*fields)`,
		`$logger.WarnCtx($ctx, $msg, $*fields)`,
		`$logger.ErrorCtx($ctx, $msg, $*fields)`,
		`$logger.DebugCtx($ctx, $msg, $*fields)`,
	).
		Where(isStructuredLogger && !m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal log message in structured logger context methods; move dynamic text into key/value fields")

	m.Match(
		`slog.Info(fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.Warn(fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.Error(fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.Debug(fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.Info(fmt.Sprint($*args), $*attrs)`,
		`slog.Warn(fmt.Sprint($*args), $*attrs)`,
		`slog.Error(fmt.Sprint($*args), $*attrs)`,
		`slog.Debug(fmt.Sprint($*args), $*attrs)`,
	).Report("use a static slog message and key/value context instead of fmt formatting")

	m.Match(
		`slog.Info($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.Warn($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.Error($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.Debug($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.Info($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.Warn($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.Error($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.Debug($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
	).
		Report("avoid fmt formatting in slog field values; pass typed values or separate fields")

	m.Match(
		`slog.Info($msg, $*attrs)`,
		`slog.Warn($msg, $*attrs)`,
		`slog.Error($msg, $*attrs)`,
		`slog.Debug($msg, $*attrs)`,
	).
		Where(m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in slog methods; move dynamic values to key/value fields")

	m.Match(
		`slog.Info($left + $right, $*attrs)`,
		`slog.Warn($left + $right, $*attrs)`,
		`slog.Error($left + $right, $*attrs)`,
		`slog.Debug($left + $right, $*attrs)`,
	).Report("avoid string concatenation in slog messages; use key/value fields")

	m.Match(
		`slog.Info($msg, $*attrs)`,
		`slog.Warn($msg, $*attrs)`,
		`slog.Error($msg, $*attrs)`,
		`slog.Debug($msg, $*attrs)`,
	).
		Where(!m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal slog message; move dynamic text into key/value fields")

	m.Match(
		`slog.Log($ctx, $level, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.Log($ctx, $level, fmt.Sprint($*args), $*attrs)`,
	).Report("use a stable slog.Log message and key/value context instead of fmt formatting")

	m.Match(
		`slog.Log($ctx, $level, $left + $right, $*attrs)`,
	).Report("avoid string concatenation in slog.Log messages; use key/value fields")

	m.Match(
		`slog.Log($ctx, $level, $msg, $*attrs)`,
	).
		Where(m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in slog.Log messages; move dynamic values to key/value fields")

	m.Match(
		`slog.Log($ctx, $level, $msg, $*attrs)`,
	).
		Where(!m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal slog.Log message; move dynamic text into key/value fields")

	m.Match(
		`slog.LogAttrs($ctx, $level, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.LogAttrs($ctx, $level, fmt.Sprint($*args), $*attrs)`,
	).Report("use a stable slog.LogAttrs message and attrs instead of fmt formatting")

	m.Match(
		`slog.LogAttrs($ctx, $level, $left + $right, $*attrs)`,
	).Report("avoid string concatenation in slog.LogAttrs messages; use structured attributes")

	m.Match(
		`slog.LogAttrs($ctx, $level, $msg, $*attrs)`,
	).
		Where(m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in slog.LogAttrs messages; move dynamic values to attributes")

	m.Match(
		`slog.LogAttrs($ctx, $level, $msg, $*attrs)`,
	).
		Where(!m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal slog.LogAttrs message; move dynamic text into structured attributes")

	m.Match(
		`slog.DebugContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.InfoContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.WarnContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.ErrorContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`slog.DebugContext($ctx, fmt.Sprint($*args), $*attrs)`,
		`slog.InfoContext($ctx, fmt.Sprint($*args), $*attrs)`,
		`slog.WarnContext($ctx, fmt.Sprint($*args), $*attrs)`,
		`slog.ErrorContext($ctx, fmt.Sprint($*args), $*attrs)`,
	).Report("use a stable slog context message and key/value context instead of fmt formatting")

	m.Match(
		`slog.DebugContext($ctx, $msg, $*attrs)`,
		`slog.InfoContext($ctx, $msg, $*attrs)`,
		`slog.WarnContext($ctx, $msg, $*attrs)`,
		`slog.ErrorContext($ctx, $msg, $*attrs)`,
	).
		Where(m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in slog context methods; move dynamic values to key/value fields")

	m.Match(
		`slog.DebugContext($ctx, $left + $right, $*attrs)`,
		`slog.InfoContext($ctx, $left + $right, $*attrs)`,
		`slog.WarnContext($ctx, $left + $right, $*attrs)`,
		`slog.ErrorContext($ctx, $left + $right, $*attrs)`,
	).Report("avoid string concatenation in slog context messages; use key/value fields")

	m.Match(
		`slog.DebugContext($ctx, $msg, $*attrs)`,
		`slog.InfoContext($ctx, $msg, $*attrs)`,
		`slog.WarnContext($ctx, $msg, $*attrs)`,
		`slog.ErrorContext($ctx, $msg, $*attrs)`,
	).
		Where(!m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal slog context message; move dynamic text into key/value fields")

	m.Match(
		`$logger.Log($ctx, $level, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`$logger.Log($ctx, $level, fmt.Sprint($*args), $*attrs)`,
	).
		Where(isSlogLogger).
		Report("use a stable slog.Logger.Log message and key/value context instead of fmt formatting")

	m.Match(
		`$logger.Log($ctx, $level, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
	).
		Where(isSlogLogger).
		Report("avoid fmt formatting in slog.Logger.Log field values; pass typed values or separate fields")

	m.Match(
		`$logger.Log($ctx, $level, $left + $right, $*attrs)`,
	).
		Where(isSlogLogger).
		Report("avoid string concatenation in slog.Logger.Log messages; use key/value fields")

	m.Match(
		`$logger.Log($ctx, $level, $msg, $*attrs)`,
	).
		Where(isSlogLogger && m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in slog.Logger.Log messages; move dynamic values to key/value fields")

	m.Match(
		`$logger.Log($ctx, $level, $msg, $*attrs)`,
	).
		Where(isSlogLogger && !m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal slog.Logger.Log message; move dynamic text into key/value fields")

	m.Match(
		`$logger.LogAttrs($ctx, $level, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`$logger.LogAttrs($ctx, $level, fmt.Sprint($*args), $*attrs)`,
	).
		Where(isSlogLogger).
		Report("use a stable slog.Logger.LogAttrs message and attrs instead of fmt formatting")

	m.Match(
		`$logger.LogAttrs($ctx, $level, $left + $right, $*attrs)`,
	).
		Where(isSlogLogger).
		Report("avoid string concatenation in slog.Logger.LogAttrs messages; use structured attributes")

	m.Match(
		`$logger.LogAttrs($ctx, $level, $msg, $*attrs)`,
	).
		Where(isSlogLogger && m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in slog.Logger.LogAttrs messages; move dynamic values to attributes")

	m.Match(
		`$logger.LogAttrs($ctx, $level, $msg, $*attrs)`,
	).
		Where(isSlogLogger && !m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal slog.Logger.LogAttrs message; move dynamic text into structured attributes")

	m.Match(
		`$logger.DebugContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`$logger.InfoContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`$logger.WarnContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`$logger.ErrorContext($ctx, fmt.Sprintf($fmt, $*args), $*attrs)`,
		`$logger.DebugContext($ctx, fmt.Sprint($*args), $*attrs)`,
		`$logger.InfoContext($ctx, fmt.Sprint($*args), $*attrs)`,
		`$logger.WarnContext($ctx, fmt.Sprint($*args), $*attrs)`,
		`$logger.ErrorContext($ctx, fmt.Sprint($*args), $*attrs)`,
	).
		Where(isSlogLogger).
		Report("use a stable slog.Logger context message and key/value context instead of fmt formatting")

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*attrs)`,
		`$logger.InfoContext($ctx, $msg, $*attrs)`,
		`$logger.WarnContext($ctx, $msg, $*attrs)`,
		`$logger.ErrorContext($ctx, $msg, $*attrs)`,
	).
		Where(isSlogLogger && m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in slog.Logger context methods; move dynamic values to key/value fields")

	m.Match(
		`$logger.DebugContext($ctx, $left + $right, $*attrs)`,
		`$logger.InfoContext($ctx, $left + $right, $*attrs)`,
		`$logger.WarnContext($ctx, $left + $right, $*attrs)`,
		`$logger.ErrorContext($ctx, $left + $right, $*attrs)`,
	).
		Where(isSlogLogger).
		Report("avoid string concatenation in slog.Logger context messages; use key/value fields")

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*attrs)`,
		`$logger.InfoContext($ctx, $msg, $*attrs)`,
		`$logger.WarnContext($ctx, $msg, $*attrs)`,
		`$logger.ErrorContext($ctx, $msg, $*attrs)`,
	).
		Where(isSlogLogger && !m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal slog.Logger context message; move dynamic text into key/value fields")

	m.Match(
		`klog.InfoS(fmt.Sprintf($fmt, $*args), $*kv)`,
		`klog.V($lvl).InfoS(fmt.Sprintf($fmt, $*args), $*kv)`,
		`klog.InfoS(fmt.Sprint($*args), $*kv)`,
		`klog.V($lvl).InfoS(fmt.Sprint($*args), $*kv)`,
		`klog.ErrorS($err, fmt.Sprintf($fmt, $*args), $*kv)`,
		`klog.ErrorS($err, fmt.Sprint($*args), $*kv)`,
	).Report("use a stable klog structured message and key/value fields instead of fmt formatting")

	m.Match(
		`klog.InfoS($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`klog.ErrorS($err, $msg, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`klog.InfoS($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, fmt.Sprint($*args), $*after)`,
		`klog.ErrorS($err, $msg, $*before, $key, fmt.Sprint($*args), $*after)`,
	).Report("avoid fmt formatting in structured klog field values; pass typed values or separate fields")

	m.Match(
		`klog.InfoS($msg, $*kv)`,
		`klog.V($lvl).InfoS($msg, $*kv)`,
		`klog.ErrorS($err, $msg, $*kv)`,
	).
		Where(m["msg"].Text.Matches("\".*%[a-zA-Z].*\"")).
		Report("printf-style format verbs are not supported in structured klog methods; move dynamic values to key/value fields")

	m.Match(
		`klog.InfoS($left + $right, $*kv)`,
		`klog.V($lvl).InfoS($left + $right, $*kv)`,
		`klog.ErrorS($err, $left + $right, $*kv)`,
	).Report("avoid string concatenation in structured klog messages; use key/value fields")

	m.Match(
		`klog.InfoS($msg, $*kv)`,
		`klog.V($lvl).InfoS($msg, $*kv)`,
		`klog.ErrorS($err, $msg, $*kv)`,
	).
		Where(!m["msg"].Text.Matches("^\".*\"$")).
		Report("prefer a stable string-literal klog message; move dynamic text into key/value fields")

	m.Match(
		`$logger.Info($msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.Warn($msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.Error($msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.Debug($msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`slog.Info($msg, $*before, "error", $err.Error(), $*after)`,
		`slog.Warn($msg, $*before, "error", $err.Error(), $*after)`,
		`slog.Error($msg, $*before, "error", $err.Error(), $*after)`,
		`slog.Debug($msg, $*before, "error", $err.Error(), $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, "error", $err.Error(), $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, "error", $err.Error(), $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, "error", $err.Error(), $*after)`,
		`klog.InfoS($msg, $*before, "error", $err.Error(), $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, "error", $err.Error(), $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, "error", $err.Error(), $*after)`,
	).
		Where(m["err"].Type.Is("error")).
		Report("pass error values directly in structured logs (\"error\", err) instead of err.Error()")

	m.Match(
		`$logger.Info($msg, $*before, "error", $errMsg, $*after)`,
		`$logger.Warn($msg, $*before, "error", $errMsg, $*after)`,
		`$logger.Error($msg, $*before, "error", $errMsg, $*after)`,
		`$logger.Debug($msg, $*before, "error", $errMsg, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`slog.Info($msg, $*before, "error", $errMsg, $*after)`,
		`slog.Warn($msg, $*before, "error", $errMsg, $*after)`,
		`slog.Error($msg, $*before, "error", $errMsg, $*after)`,
		`slog.Debug($msg, $*before, "error", $errMsg, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, "error", $errMsg, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, "error", $errMsg, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, "error", $errMsg, $*after)`,
		`klog.InfoS($msg, $*before, "error", $errMsg, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, "error", $errMsg, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, "error", $errMsg, $*after)`,
	).
		Where(!m["errMsg"].Type.Is("error") && !m["errMsg"].Type.Implements("error")).
		Report("use \"errorMessage\" for string error text, or pass an error value as \"error\", err")

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.InfoContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.WarnContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.ErrorContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.DebugContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { $logger.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { $logger.ErrorCtx($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { slog.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { slog.ErrorContext($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { klog.ErrorS($baseErr, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { $logger.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { $logger.ErrorCtx($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { slog.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { slog.ErrorContext($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { klog.ErrorS($baseErr, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
	).
		Report(`for recovered panic payloads (including type-asserted panic errors), use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { $logger.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { $logger.ErrorCtx($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { slog.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { slog.ErrorContext($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { klog.ErrorS($baseErr, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { $logger.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { $logger.ErrorCtx($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { slog.Error($msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { slog.ErrorContext($ctx, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { klog.ErrorS($baseErr, $msg, $*before, "error", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
	).
		Report(`for recovered panic payloads (including assignment style type assertions), use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.InfoContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.WarnContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.ErrorContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.DebugContext($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.InfoContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.WarnContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.DebugContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.InfoContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.WarnContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.DebugContext($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { $logger.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { $logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { slog.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { $logger.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { $logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { slog.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
	).
		Report(`for recovered panic payloads (including type-asserted panic errors), use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { $logger.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { $logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { slog.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { $logger.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { $logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { slog.Error($msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
	).
		Report(`for recovered panic payloads (including assignment style type assertions), use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.InfoContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.WarnContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.ErrorContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.DebugContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads, use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.InfoContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.WarnContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.ErrorContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.DebugContext($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { $logger.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { $logger.ErrorCtx($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { slog.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { slog.ErrorContext($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { klog.ErrorS($baseErr, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { $logger.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { $logger.ErrorCtx($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { slog.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { slog.ErrorContext($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { if $panicErr, $ok := $panicVal.(error); $ok { if $cond { klog.ErrorS($baseErr, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
	).
		Report(`for recovered panic payloads (including type-asserted panic errors), use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { $logger.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { $logger.ErrorCtx($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { slog.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { slog.ErrorContext($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { klog.ErrorS($baseErr, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { $logger.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { $logger.ErrorCtx($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { slog.Error($msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { slog.ErrorContext($ctx, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $panicErr, $ok := $panicVal.(error); if $ok { if $cond { klog.ErrorS($baseErr, $msg, $*before, "reason", $panicErr, $*after); $*_ }; $*_ }; $*_ }`,
	).
		Report(`for recovered panic payloads (including assignment style type assertions), use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and []any spread arguments, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and []any spread arguments, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and appended spread arguments, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and appended spread arguments, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr = append($arr, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr := append($arr, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and append-built key/value slices, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr = append($arr, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr := append($arr, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and append-built key/value slices, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr = []any{$*before, "error", $panicVal, $*after}; $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr := []any{$*before, "error", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and []any literal key/value slices, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr = []any{$*before, "errorMessage", $panicVal, $*after}; $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr := []any{$*before, "errorMessage", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and []any literal key/value slices, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.New($*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.With($*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and structured context builders, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.New($*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.With($*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and structured context builders, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Group($group, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and slog.Group fields, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Group($group, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and slog.Group fields, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and []any spread arguments, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Info($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Warn($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Error($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Debug($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Info($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Warn($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Error($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Debug($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Log($ctx, $level, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.Log($ctx, $level, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.InfoS($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.V($lvl).InfoS($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { klog.ErrorS($baseErr, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and appended spread arguments, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr = append($arr, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr := append($arr, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and append-built key/value slices, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr = []any{$*before, "reason", $panicVal, $*after}; $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $arr := []any{$*before, "reason", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and []any literal key/value slices, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.New($*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { $logger.With($*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and structured context builders, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal == nil { $*_ } else { slog.Group($group, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in recover else-branches and slog.Group fields, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in []any spread arguments, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in []any spread arguments, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in appended spread arguments, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in appended spread arguments, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $arr = append($arr, $*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $arr := append($arr, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in append-built key/value slices, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $arr = append($arr, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $arr := append($arr, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in append-built key/value slices, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $arr = []any{$*before, "error", $panicVal, $*after}; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $arr := []any{$*before, "error", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in []any literal key/value slices, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $arr = []any{$*before, "errorMessage", $panicVal, $*after}; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $arr := []any{$*before, "errorMessage", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in []any literal key/value slices, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.New($*before, "error", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.With($*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in structured context builders, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.New($*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.With($*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in structured context builders, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { slog.Group($group, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in slog.Group fields, use key "panicValue" instead of "error"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { slog.Group($group, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in slog.Group fields, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in []any spread arguments, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.Info($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Warn($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Error($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Debug($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Info($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Warn($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Error($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Debug($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { slog.Log($ctx, $level, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.Log($ctx, $level, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.InfoS($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.V($lvl).InfoS($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { klog.ErrorS($baseErr, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in appended spread arguments, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $arr = append($arr, $*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $arr := append($arr, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in append-built key/value slices, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $arr = []any{$*before, "reason", $panicVal, $*after}; $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $arr := []any{$*before, "reason", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in []any literal key/value slices, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { $logger.New($*before, "reason", $panicVal, $*after); $*_ }`,
		`if $panicVal := recover(); $panicVal != nil { $logger.With($*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in structured context builders, use key "panicValue" instead of "reason"`)

	m.Match(
		`if $panicVal := recover(); $panicVal != nil { slog.Group($group, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in slog.Group fields, use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, []any{$*before, "error", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in []any spread arguments, use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, []any{$*before, "errorMessage", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in []any spread arguments, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, append($arr, $*before, "error", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in appended spread arguments, use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, append($arr, $*before, "errorMessage", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in appended spread arguments, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $arr = append($arr, $*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $arr := append($arr, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in append-built key/value slices, use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $arr = append($arr, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $arr := append($arr, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in append-built key/value slices, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $arr = []any{$*before, "error", $panicVal, $*after}; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $arr := []any{$*before, "error", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in []any literal key/value slices, use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $arr = []any{$*before, "errorMessage", $panicVal, $*after}; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $arr := []any{$*before, "errorMessage", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in []any literal key/value slices, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.New($*before, "error", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.With($*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in structured context builders, use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.New($*before, "errorMessage", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.With($*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in structured context builders, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { slog.Group($group, $*before, "error", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in slog.Group fields, use key "panicValue" instead of "error"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { slog.Group($group, $*before, "errorMessage", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in slog.Group fields, use key "panicValue" instead of "errorMessage"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, []any{$*before, "reason", $panicVal, $*after}...); $*_ }`,
	).
		Report(`for recovered panic payloads in []any spread arguments, use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.Info($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Warn($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Error($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Debug($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.InfoCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.WarnCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.ErrorCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.DebugCtx($ctx, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Info($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Warn($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Error($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Debug($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { slog.Log($ctx, $level, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.Log($ctx, $level, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.InfoS($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.V($lvl).InfoS($msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { klog.ErrorS($baseErr, $msg, append($arr, $*before, "reason", $panicVal, $*after)...); $*_ }`,
	).
		Report(`for recovered panic payloads in appended spread arguments, use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $arr = append($arr, $*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $arr := append($arr, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in append-built key/value slices, use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $arr = []any{$*before, "reason", $panicVal, $*after}; $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $arr := []any{$*before, "reason", $panicVal, $*after}; $*_ }`,
	).
		Report(`for recovered panic payloads in []any literal key/value slices, use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { $logger.New($*before, "reason", $panicVal, $*after); $*_ }`,
		`$panicVal := recover(); if $panicVal != nil { $logger.With($*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in structured context builders, use key "panicValue" instead of "reason"`)

	m.Match(
		`$panicVal := recover(); if $panicVal != nil { slog.Group($group, $*before, "reason", $panicVal, $*after); $*_ }`,
	).
		Report(`for recovered panic payloads in slog.Group fields, use key "panicValue" instead of "reason"`)

	m.Match(
		`$logger.Info($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Warn($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Error($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Debug($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Info($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Warn($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Error($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Debug($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`klog.InfoS($msg, $*before, "errorMessage", $errVal, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, "errorMessage", $errVal, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $errVal, $*after)`,
	).
		Where(m["errVal"].Type.Is("error") || m["errVal"].Type.Implements("error")).
		Report("use \"error\" for error objects in structured logs; reserve \"errorMessage\" for textual error details")

	m.Match(
		`$logger.Info($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Warn($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Error($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Debug($msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Info($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Warn($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Error($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Debug($msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, "errorMessage", $errVal, $*after)`,
		`klog.InfoS($msg, $*before, "errorMessage", $errVal, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, "errorMessage", $errVal, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, "errorMessage", $errVal, $*after)`,
	).
		Where(
			m["errVal"].Type.Is("bool") ||
				m["errVal"].Type.Is("int") ||
				m["errVal"].Type.Is("int8") ||
				m["errVal"].Type.Is("int16") ||
				m["errVal"].Type.Is("int32") ||
				m["errVal"].Type.Is("int64") ||
				m["errVal"].Type.Is("uint") ||
				m["errVal"].Type.Is("uint8") ||
				m["errVal"].Type.Is("uint16") ||
				m["errVal"].Type.Is("uint32") ||
				m["errVal"].Type.Is("uint64") ||
				m["errVal"].Type.Is("float32") ||
				m["errVal"].Type.Is("float64"),
		).
		Report("\"errorMessage\" should contain textual details; use contextual typed keys such as \"errorCode\", \"errorCount\", or \"hasError\" for numeric/bool values")

	m.Match(
		`$logger.Info($msg, $err, $*rest)`,
		`$logger.Warn($msg, $err, $*rest)`,
		`$logger.Error($msg, $err, $*rest)`,
		`$logger.Debug($msg, $err, $*rest)`,
		`$logger.InfoCtx($ctx, $msg, $err, $*rest)`,
		`$logger.WarnCtx($ctx, $msg, $err, $*rest)`,
		`$logger.ErrorCtx($ctx, $msg, $err, $*rest)`,
		`$logger.DebugCtx($ctx, $msg, $err, $*rest)`,
		`slog.Info($msg, $err, $*rest)`,
		`slog.Warn($msg, $err, $*rest)`,
		`slog.Error($msg, $err, $*rest)`,
		`slog.Debug($msg, $err, $*rest)`,
		`slog.InfoContext($ctx, $msg, $err, $*rest)`,
		`slog.WarnContext($ctx, $msg, $err, $*rest)`,
		`slog.ErrorContext($ctx, $msg, $err, $*rest)`,
		`slog.DebugContext($ctx, $msg, $err, $*rest)`,
		`slog.Log($ctx, $level, $msg, $err, $*rest)`,
		`$logger.Log($ctx, $level, $msg, $err, $*rest)`,
		`klog.InfoS($msg, $err, $*rest)`,
		`klog.V($lvl).InfoS($msg, $err, $*rest)`,
		`klog.ErrorS($baseErr, $msg, $err, $*rest)`,
	).
		Where(m["err"].Type.Is("error")).
		Report("avoid passing bare error arguments to structured logs; use key/value fields like \"error\", err")

	m.Match(
		`$logger.Info($msg, $arg, $*rest)`,
		`$logger.Warn($msg, $arg, $*rest)`,
		`$logger.Error($msg, $arg, $*rest)`,
		`$logger.Debug($msg, $arg, $*rest)`,
		`$logger.InfoCtx($ctx, $msg, $arg, $*rest)`,
		`$logger.WarnCtx($ctx, $msg, $arg, $*rest)`,
		`$logger.ErrorCtx($ctx, $msg, $arg, $*rest)`,
		`$logger.DebugCtx($ctx, $msg, $arg, $*rest)`,
		`slog.Info($msg, $arg, $*rest)`,
		`slog.Warn($msg, $arg, $*rest)`,
		`slog.Error($msg, $arg, $*rest)`,
		`slog.Debug($msg, $arg, $*rest)`,
		`slog.InfoContext($ctx, $msg, $arg, $*rest)`,
		`slog.WarnContext($ctx, $msg, $arg, $*rest)`,
		`slog.ErrorContext($ctx, $msg, $arg, $*rest)`,
		`slog.DebugContext($ctx, $msg, $arg, $*rest)`,
		`slog.Log($ctx, $level, $msg, $arg, $*rest)`,
		`$logger.Log($ctx, $level, $msg, $arg, $*rest)`,
		`klog.InfoS($msg, $arg, $*rest)`,
		`klog.V($lvl).InfoS($msg, $arg, $*rest)`,
		`klog.ErrorS($baseErr, $msg, $arg, $*rest)`,
	).
		Where(!m["arg"].Type.Is("string")).
		Report("structured log attributes should start with a string key; pass key/value pairs instead of bare values")

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $dangling)`,
		`$logger.Warn($msg, $*before, $key, $value, $dangling)`,
		`$logger.Error($msg, $*before, $key, $value, $dangling)`,
		`$logger.Debug($msg, $*before, $key, $value, $dangling)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $dangling)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $dangling)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $dangling)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $dangling)`,
		`slog.Info($msg, $*before, $key, $value, $dangling)`,
		`slog.Warn($msg, $*before, $key, $value, $dangling)`,
		`slog.Error($msg, $*before, $key, $value, $dangling)`,
		`slog.Debug($msg, $*before, $key, $value, $dangling)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $dangling)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $dangling)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $dangling)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $dangling)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $dangling)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $dangling)`,
		`klog.InfoS($msg, $*before, $key, $value, $dangling)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $dangling)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $dangling)`,
	).
		Where(m["key"].Type.Is("string") && m["dangling"].Type.Is("string")).
		Report("structured log call has a dangling key without a value; ensure key/value arguments are paired")

	m.Match(
		`$logger.New($*before, $key, $value, $dangling)`,
		`$logger.With($*before, $key, $value, $dangling)`,
	).
		Where(isStructuredLogger && m["key"].Type.Is("string") && m["dangling"].Type.Is("string")).
		Report("structured context builder has a dangling key without a value; ensure key/value arguments are paired")

	m.Match(
		`slog.Group($group, $*before, $key, $value, $dangling)`,
	).
		Where(m["key"].Type.Is("string") && m["dangling"].Type.Is("string")).
		Report("slog.Group call has a dangling key without a value; ensure field arguments are paired")

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in structured log keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in structured log keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in structured log keys (for example "dashboardUID", "integrationUID")`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in structured log keys (for example "dashboardUID", "integrationUID")`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"(userid|orgid|pluginid|traceid|panelpluginid|streamid|configid|datasourceid|dashboardid|panelid|querygroupid|migrationid|resourceversion)\"$")).
		Report(`avoid all-lowercase "…id" structured log keys; use canonical casing like "userID", "orgID", "pluginID", "traceID", "panelPluginID", "streamID", "configID"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(userid|orgid|pluginid|traceid|panelpluginid|streamid|configid|datasourceid|dashboardid|panelid|querygroupid|migrationid|resourceversion)\"$")).
		Report(`avoid all-lowercase "…id" structured log keys; use canonical casing like "userID", "orgID", "pluginID", "traceID", "panelPluginID", "streamID", "configID"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason)\"$")).
		Report(`avoid ambiguous structured log keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "response", "code", "ids", "os", "file", "tag", "arm", "cc", "cxx", "arch", "repos", "tls", "status", "kind", "dir", "path", "url", or "reason"; use contextual keys such as "userID", "dashboardUID", "orgID", "configID", "queryText", "ruleUID", "checkRequest", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "resourceKind", "scopeKind", "eventKind", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "cacheKey", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "requestURL", "requestPath", "resourcePath", "streamPath", "folderPath", "appName", "pluginID", "requestBody", "responseBody", "statusCode", "statusText", "requestStatus", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", "temporaryFilePath", "containerTag", "tagFormat", "encodedTag", "goARM", "cCompiler", "cppCompiler", "architecture", "repositoryNames", "tlsEnabled", "directoryPath", or "artifactPath"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous structured log keys "user", "client", or "uname"; use specific keys such as "userID", "userLogin", "clientID", "authClient", or "authClientName"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous structured log key "type"; use contextual keys such as "datasourceType", "resourceType", "resourceEventType", "identityType", "eventType", "objectType", "secretType", or "keeperType"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous structured log key "value"; use contextual keys such as "configValue", "measurementValue", "sampleValue", "fieldValue", "headerValue", "argumentValue", "responseValue", or "kvValue"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous structured log key "info"; use contextual keys such as "messageInfo", "buildInfo", "runtimeInfo", "pluginInfo", or "userInfoData"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous structured log key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason)\"$")).
		Report(`avoid ambiguous structured log keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "response", "code", "ids", "os", "file", "tag", "arm", "cc", "cxx", "arch", "repos", "tls", "status", "kind", "dir", "path", "url", or "reason"; use contextual keys such as "userID", "dashboardUID", "orgID", "configID", "queryText", "ruleUID", "checkRequest", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "resourceKind", "scopeKind", "eventKind", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "cacheKey", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "requestURL", "requestPath", "resourcePath", "streamPath", "folderPath", "appName", "pluginID", "requestBody", "responseBody", "statusCode", "statusText", "requestStatus", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", "temporaryFilePath", "containerTag", "tagFormat", "encodedTag", "goARM", "cCompiler", "cppCompiler", "architecture", "repositoryNames", "tlsEnabled", "directoryPath", or "artifactPath"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous structured log keys "user", "client", or "uname"; use specific keys such as "userID", "userLogin", "clientID", "authClient", or "authClientName"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous structured log key "type"; use contextual keys such as "datasourceType", "resourceType", "resourceEventType", "identityType", "eventType", "objectType", "secretType", or "keeperType"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous structured log key "value"; use contextual keys such as "configValue", "measurementValue", "sampleValue", "fieldValue", "headerValue", "argumentValue", "responseValue", or "kvValue"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous structured log key "info"; use contextual keys such as "messageInfo", "buildInfo", "runtimeInfo", "pluginInfo", or "userInfoData"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous structured log key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"data\"$")).
		Report(`avoid ambiguous structured log key "data"; use contextual keys such as "requestData", "responseData", "userData", or "payloadData"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason)\"$")).
		Report(`avoid ambiguous keys in []any key/value slices; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", or "responseBody"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous keys "user", "client", or "uname" in []any key/value slices; use specific keys such as "userID", "userLogin", "clientID", "authClient", or "authClientName"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous key "type" in []any key/value slices; use contextual keys such as "datasourceType", "resourceType", or "eventType"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous key "value" in []any key/value slices; use contextual keys such as "measurementValue", "fieldValue", "responseValue", or "configValue"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous key "info" in []any key/value slices; use contextual keys such as "messageInfo", "buildInfo", or "runtimeInfo"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous key "reason" in []any key/value slices; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous key "panic" in []any key/value slices; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && !m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in []any key/value slices; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason)\"$")).
		Report(`avoid ambiguous keys in []any literal key/value slices; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", or "responseBody"`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous keys "user", "client", or "uname" in []any literal key/value slices; use specific keys such as "userID", "userLogin", "clientID", "authClient", or "authClientName"`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous key "type" in []any literal key/value slices; use contextual keys such as "datasourceType", "resourceType", or "eventType"`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous key "value" in []any literal key/value slices; use contextual keys such as "measurementValue", "fieldValue", "responseValue", or "configValue"`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous key "info" in []any literal key/value slices; use contextual keys such as "messageInfo", "buildInfo", or "runtimeInfo"`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous key "reason" in []any literal key/value slices; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous key "panic" in []any literal key/value slices; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`$arr := []any{$*before, $key, $value, $*after}`,
		`$arr = []any{$*before, $key, $value, $*after}`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in []any literal key/value slices; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`[]any{$*before, "error", $err.Error(), $*after}`,
	).
		Where(m["err"].Type.Is("error")).
		Report(`use "errorMessage" for stringified error text in []any key/value slices; keep "error" for error objects`)

	m.Match(
		`append($arr, $*before, "error", $err.Error(), $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["err"].Type.Is("error")).
		Report(`use "errorMessage" for stringified error text in []any key/value slices; keep "error" for error objects`)

	m.Match(
		`[]any{$*before, "error", $errMsg, $*after}`,
	).
		Where(!m["errMsg"].Type.Is("error") && !m["errMsg"].Type.Implements("error")).
		Report(`use "errorMessage" for stringified error text in []any key/value slices; keep "error" for error objects`)

	m.Match(
		`[]any{$*before, "errorMessage", $errVal, $*after}`,
	).
		Where(m["errVal"].Type.Is("error") || m["errVal"].Type.Implements("error")).
		Report(`use "error" for error objects in []any key/value slices; reserve "errorMessage" for textual error details`)

	m.Match(
		`[]any{$*before, "errorMessage", $errVal, $*after}`,
	).
		Where(
			m["errVal"].Type.Is("bool") ||
				m["errVal"].Type.Is("int") ||
				m["errVal"].Type.Is("int8") ||
				m["errVal"].Type.Is("int16") ||
				m["errVal"].Type.Is("int32") ||
				m["errVal"].Type.Is("int64") ||
				m["errVal"].Type.Is("uint") ||
				m["errVal"].Type.Is("uint8") ||
				m["errVal"].Type.Is("uint16") ||
				m["errVal"].Type.Is("uint32") ||
				m["errVal"].Type.Is("uint64") ||
				m["errVal"].Type.Is("float32") ||
				m["errVal"].Type.Is("float64"),
		).
		Report(`"errorMessage" in []any key/value slices should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for numeric/bool values`)

	m.Match(
		`append($arr, $*before, "error", $errMsg, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && !m["errMsg"].Type.Is("error") && !m["errMsg"].Type.Implements("error")).
		Report(`use "errorMessage" for stringified error text in []any key/value slices; keep "error" for error objects`)

	m.Match(
		`append($arr, $*before, "errorMessage", $errVal, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && (m["errVal"].Type.Is("error") || m["errVal"].Type.Implements("error"))).
		Report(`use "error" for error objects in []any key/value slices; reserve "errorMessage" for textual error details`)

	m.Match(
		`append($arr, $*before, "errorMessage", $errVal, $*after)`,
	).
		Where(
			m["arr"].Type.Is("[]any") &&
				(m["errVal"].Type.Is("bool") ||
					m["errVal"].Type.Is("int") ||
					m["errVal"].Type.Is("int8") ||
					m["errVal"].Type.Is("int16") ||
					m["errVal"].Type.Is("int32") ||
					m["errVal"].Type.Is("int64") ||
					m["errVal"].Type.Is("uint") ||
					m["errVal"].Type.Is("uint8") ||
					m["errVal"].Type.Is("uint16") ||
					m["errVal"].Type.Is("uint32") ||
					m["errVal"].Type.Is("uint64") ||
					m["errVal"].Type.Is("float32") ||
					m["errVal"].Type.Is("float64")),
		).
		Report(`"errorMessage" in []any key/value slices should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for numeric/bool values`)

	m.Match(
		`[]any{$*before, $key, $value, $dangling}`,
	).
		Where(m["key"].Type.Is("string") && m["dangling"].Type.Is("string")).
		Report("[]any key/value slice has a dangling key without a value; ensure key/value arguments are paired")

	m.Match(
		`append($arr, $*before, $key, $value, $dangling)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Type.Is("string") && m["dangling"].Type.Is("string")).
		Report("append([]any, ...) key/value slice has a dangling key without a value; ensure key/value arguments are paired")

	m.Match(
		`append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`append($arr, $*before, $key, fmt.Sprint($*args), $*after)`,
	).
		Where(m["arr"].Type.Is("[]any")).
		Report(`avoid fmt formatting in []any key/value slices; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`append($arr, $*before, $key, $left + $right, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in []any key/value slices; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in []any key/value slices (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in []any key/value slices (for example "dashboardUID", "ruleUID", "datasourceUID")`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case keys in []any key/value slices; use camelCase with canonical acronym casing`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in []any keys; use compact camelCase keys`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated keys in []any key/value slices; use camelCase keys`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted keys in []any key/value slices; prefer flat camelCase keys`)

	m.Match(
		`append($arr, $*before, $key, $value, $*after)`,
	).
		Where(m["arr"].Type.Is("[]any") && m["key"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading keys in []any key/value slices; use lower camelCase with canonical acronym casing`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in slog.Group fields; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous slog.Group key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous slog.Group key "panic"; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`slog.Group($group, $*before, "error", $err.Error(), $*after)`,
	).
		Where(m["err"].Type.Is("error")).
		Report(`use "errorMessage" for stringified error text in slog.Group fields (for example slog.Group("context", "errorMessage", err.Error())); keep "error" for error objects`)

	m.Match(
		`slog.Group($group, $*before, "error", $errMsg, $*after)`,
	).
		Where(!m["errMsg"].Type.Is("error") && !m["errMsg"].Type.Implements("error")).
		Report(`use "errorMessage" for stringified error text in slog.Group fields; keep "error" for error objects`)

	m.Match(
		`slog.Group($group, $*before, "errorMessage", $errVal, $*after)`,
	).
		Where(m["errVal"].Type.Is("error") || m["errVal"].Type.Implements("error")).
		Report(`use "error" for error objects in slog.Group fields; reserve "errorMessage" for textual error details`)

	m.Match(
		`slog.Group($group, $*before, "errorMessage", $errVal, $*after)`,
	).
		Where(
			m["errVal"].Type.Is("bool") ||
				m["errVal"].Type.Is("int") ||
				m["errVal"].Type.Is("int8") ||
				m["errVal"].Type.Is("int16") ||
				m["errVal"].Type.Is("int32") ||
				m["errVal"].Type.Is("int64") ||
				m["errVal"].Type.Is("uint") ||
				m["errVal"].Type.Is("uint8") ||
				m["errVal"].Type.Is("uint16") ||
				m["errVal"].Type.Is("uint32") ||
				m["errVal"].Type.Is("uint64") ||
				m["errVal"].Type.Is("float32") ||
				m["errVal"].Type.Is("float64"),
		).
		Report(`"errorMessage" in slog.Group fields should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for numeric/bool values`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in slog.Group fields; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in slog.Group []any literal spread fields; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous slog.Group []any spread key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous slog.Group []any spread key "panic"; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in slog.Group []any literal spread fields; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in slog.Group appended fields; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous slog.Group appended key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous slog.Group appended key "panic"; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in slog.Group appended fields; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in slog.Group field keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in slog.Group field keys (for example "dashboardUID", "ruleUID", "datasourceUID")`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case slog.Group field keys; use camelCase with canonical acronym casing`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in slog.Group field keys; use compact camelCase keys`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated slog.Group field keys; use camelCase keys`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted slog.Group field keys; prefer flat camelCase keys`)

	m.Match(
		`slog.Group($group, $*before, $key, $value, $*after)`,
		`slog.Group($group, []any{$*before, $key, $value, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading slog.Group field keys; use lower camelCase with canonical acronym casing`)

	m.Match(
		`slog.Group($group, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`slog.Group($group, $*before, $key, fmt.Sprint($*args), $*after)`,
	).
		Report(`avoid fmt formatting in slog.Group field values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`slog.Group($group, $*before, $key, $left + $right, $*after)`,
		`slog.Group($group, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.Group($group, append($arr, $*before, $key, $left + $right, $*after)...)`,
	).
		Where(m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in slog.Group field values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`slog.Group($group, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.Group($group, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
	).
		Report(`avoid fmt formatting in slog.Group []any literal field values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`slog.Group($group, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.Group($group, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
	).
		Report(`avoid fmt formatting in slog.Group appended field values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`slog.Group($left + $right, $*fields)`,
	).
		Report(`avoid dynamic concatenation for slog group names; use stable string-literal group names`)

	m.Match(
		`slog.Group(fmt.Sprintf($fmt, $*args), $*fields)`,
		`slog.Group(fmt.Sprint($*args), $*fields)`,
	).
		Report(`avoid fmt formatting for slog group names; use stable string-literal group names`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(!m["group"].Const && !m["group"].Text.Matches("^\".*\"$")).
		Report(`prefer stable string-literal or const slog group names; avoid runtime-generated group keys`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous slog group names like "status", "path", "type", or "value"; use contextual names such as "requestContext", "queryInfo", "datasourceConfig", or "pluginMetadata"`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous slog group name "reason"; use contextual names such as "shutdownContext", "validationContext", "indexBuildContext", or "stateTransitionContext"`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous slog group name "panic"; use contextual names such as "panicContext" or "recoveryContext", and use "panicValue" for recovered panic payload fields`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in slog group names (for example "userIDContext", "orgIDMetadata")`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in slog group names (for example "dashboardUIDContext", "datasourceUIDMetadata")`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case slog group names; use camelCase with canonical acronym casing`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in slog group names; use compact camelCase names`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated slog group names; use camelCase names`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted slog group names; prefer flat camelCase names`)

	m.Match(
		`slog.Group($group, $*fields)`,
	).
		Where(m["group"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading slog group names; use lower camelCase with canonical acronym casing`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in slog attribute constructors; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous slog attribute key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous slog attribute key "panic"; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in slog attribute constructors; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`slog.String($left + $right, $value)`,
		`slog.Int($left + $right, $value)`,
		`slog.Int64($left + $right, $value)`,
		`slog.Uint64($left + $right, $value)`,
		`slog.Bool($left + $right, $value)`,
		`slog.Float64($left + $right, $value)`,
		`slog.Duration($left + $right, $value)`,
		`slog.Time($left + $right, $value)`,
		`slog.Any($left + $right, $value)`,
	).
		Report(`avoid dynamic concatenation for slog attribute keys; use stable string-literal keys`)

	m.Match(
		`slog.String(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Int(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Int64(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Uint64(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Bool(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Float64(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Duration(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Time(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.Any(fmt.Sprintf($fmt, $*args), $value)`,
		`slog.String(fmt.Sprint($*args), $value)`,
		`slog.Int(fmt.Sprint($*args), $value)`,
		`slog.Int64(fmt.Sprint($*args), $value)`,
		`slog.Uint64(fmt.Sprint($*args), $value)`,
		`slog.Bool(fmt.Sprint($*args), $value)`,
		`slog.Float64(fmt.Sprint($*args), $value)`,
		`slog.Duration(fmt.Sprint($*args), $value)`,
		`slog.Time(fmt.Sprint($*args), $value)`,
		`slog.Any(fmt.Sprint($*args), $value)`,
	).
		Report(`avoid fmt formatting for slog attribute keys; use stable string-literal keys`)

	m.Match(
		`slog.String($key, $left + $right)`,
	).
		Where(m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in slog attribute values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`slog.String("error", $value)`,
	).
		Report(`for string-formatted errors in slog attributes, use key "errorMessage"; reserve key "error" for error objects`)

	m.Match(
		`slog.Any("error", $value)`,
	).
		Where(!m["value"].Type.Is("error") && !m["value"].Type.Implements("error")).
		Report(`for non-error payloads in slog attributes, use key "errorMessage"; reserve key "error" for error objects`)

	m.Match(
		`slog.Any("errorMessage", $value)`,
	).
		Where(m["value"].Type.Is("error") || m["value"].Type.Implements("error")).
		Report(`for error objects in slog attributes, use key "error"; reserve "errorMessage" for textual details`)

	m.Match(
		`slog.Any("errorMessage", $value)`,
	).
		Where(
			m["value"].Type.Is("bool") ||
				m["value"].Type.Is("int") ||
				m["value"].Type.Is("int8") ||
				m["value"].Type.Is("int16") ||
				m["value"].Type.Is("int32") ||
				m["value"].Type.Is("int64") ||
				m["value"].Type.Is("uint") ||
				m["value"].Type.Is("uint8") ||
				m["value"].Type.Is("uint16") ||
				m["value"].Type.Is("uint32") ||
				m["value"].Type.Is("uint64") ||
				m["value"].Type.Is("float32") ||
				m["value"].Type.Is("float64"),
		).
		Report(`"errorMessage" slog attributes should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for numeric/bool values`)

	m.Match(
		`slog.Int("error", $value)`,
		`slog.Int64("error", $value)`,
		`slog.Uint64("error", $value)`,
		`slog.Bool("error", $value)`,
		`slog.Float64("error", $value)`,
		`slog.Duration("error", $value)`,
		`slog.Time("error", $value)`,
	).
		Report(`for non-error payloads in slog attributes, use key "errorMessage"; reserve key "error" for error objects`)

	m.Match(
		`slog.Int("errorMessage", $value)`,
		`slog.Int64("errorMessage", $value)`,
		`slog.Uint64("errorMessage", $value)`,
		`slog.Bool("errorMessage", $value)`,
		`slog.Float64("errorMessage", $value)`,
		`slog.Duration("errorMessage", $value)`,
		`slog.Time("errorMessage", $value)`,
	).
		Report(`"errorMessage" should contain textual error details; use contextual typed keys such as "errorCode", "errorCount", "retryDelay", or "hasError" for non-text values`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in slog attribute keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in slog attribute keys (for example "dashboardUID", "ruleUID", "datasourceUID")`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case slog attribute keys; use camelCase with canonical acronym casing`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in slog attribute keys; use compact camelCase keys such as "rowsAffected" or "currentProvider"`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated slog attribute keys; use camelCase keys such as "contentType" or "rowsAffected"`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted slog attribute keys; prefer flat camelCase keys with canonical acronym casing`)

	m.Match(
		`slog.String($key, $value)`,
		`slog.Int($key, $value)`,
		`slog.Int64($key, $value)`,
		`slog.Uint64($key, $value)`,
		`slog.Bool($key, $value)`,
		`slog.Float64($key, $value)`,
		`slog.Duration($key, $value)`,
		`slog.Time($key, $value)`,
		`slog.Any($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading slog attribute keys; use lower camelCase with canonical acronym casing`)

	m.Match(
		`slog.String($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Int($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Int64($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Uint64($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Bool($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Float64($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Duration($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Time($key, fmt.Sprintf($fmt, $*args))`,
		`slog.Any($key, fmt.Sprintf($fmt, $*args))`,
		`slog.String($key, fmt.Sprint($*args))`,
		`slog.Int($key, fmt.Sprint($*args))`,
		`slog.Int64($key, fmt.Sprint($*args))`,
		`slog.Uint64($key, fmt.Sprint($*args))`,
		`slog.Bool($key, fmt.Sprint($*args))`,
		`slog.Float64($key, fmt.Sprint($*args))`,
		`slog.Duration($key, fmt.Sprint($*args))`,
		`slog.Time($key, fmt.Sprint($*args))`,
		`slog.Any($key, fmt.Sprint($*args))`,
	).
		Report(`avoid fmt formatting in slog attribute constructor values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in []any literal spread arguments; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous key "reason" in []any literal spread arguments; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous key "panic" in []any literal spread arguments; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in []any literal spread arguments; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in []any literal spread keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, $value, $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, $value, $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(m["key"].Text.Matches("^\"([A-Za-z_]+Uid|[A-Za-z0-9]+_[A-Za-z0-9_]+|.*\\s+.*|[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+|[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+|[A-Z][A-Za-z0-9_.]*)\"$")).
		Report(`avoid non-canonical []any literal spread keys; use lower camelCase with canonical acronym casing (for example "dashboardUID", "requestPath", "statusCode")`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.Info($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
	).
		Report(`avoid fmt formatting in []any literal spread values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.Info($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.Warn($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.Error($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.Debug($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.InfoCtx($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.WarnCtx($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.ErrorCtx($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.DebugCtx($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.Info($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.Warn($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.Error($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.Debug($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.InfoContext($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.WarnContext($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.ErrorContext($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.DebugContext($ctx, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`slog.Log($ctx, $level, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.Log($ctx, $level, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`klog.InfoS($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`klog.V($lvl).InfoS($msg, []any{$*before, $key, $left + $right, $*after}...)`,
		`klog.ErrorS($baseErr, $msg, []any{$*before, $key, $left + $right, $*after}...)`,
	).
		Where(m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in []any literal spread values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, $value, $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in []any literal spread context arguments; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, $value, $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous key "reason" in []any literal spread context arguments; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, $value, $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous key "panic" in []any literal spread context arguments; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, $value, $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(isStructuredLogger && !m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in []any literal spread context arguments; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, fmt.Sprintf($fmt, $*args), $*after}...)`,
		`$logger.New($*prefix, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, fmt.Sprint($*args), $*after}...)`,
	).
		Where(isStructuredLogger).
		Report(`avoid fmt formatting in []any literal spread context values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, $left + $right, $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, $left + $right, $*after}...)`,
	).
		Where(isStructuredLogger && m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in []any literal spread context values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, $value, $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in []any literal spread context keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`$logger.New($*prefix, []any{$*before, $key, $value, $*after}...)`,
		`$logger.With($*prefix, []any{$*before, $key, $value, $*after}...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"([A-Za-z_]+Uid|[A-Za-z0-9]+_[A-Za-z0-9_]+|.*\\s+.*|[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+|[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+|[A-Z][A-Za-z0-9_.]*)\"$")).
		Report(`avoid non-canonical []any literal spread context keys; use lower camelCase with canonical acronym casing (for example "dashboardUID", "requestPath", "statusCode")`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in appended structured context arguments; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous key "reason" in appended structured context arguments; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous key "panic" in appended structured context arguments; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(isStructuredLogger && !m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in appended structured context arguments; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.New($*prefix, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
	).
		Where(isStructuredLogger).
		Report(`avoid fmt formatting in appended structured context values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, $left + $right, $*after)...)`,
	).
		Where(isStructuredLogger && m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in appended structured context values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.New($*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.With($*before, $key, fmt.Sprintf($fmt, $*args), $*after)`,
		`$logger.New($*before, $key, fmt.Sprint($*args), $*after)`,
		`$logger.With($*before, $key, fmt.Sprint($*args), $*after)`,
	).
		Where(isStructuredLogger).
		Report(`avoid fmt formatting in structured context values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.New($*before, $key, $left + $right, $*after)`,
		`$logger.With($*before, $key, $left + $right, $*after)`,
	).
		Where(isStructuredLogger && m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in structured context values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in appended structured context keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`$logger.New($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.With($*prefix, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"([A-Za-z_]+Uid|[A-Za-z0-9]+_[A-Za-z0-9_]+|.*\\s+.*|[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+|[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+|[A-Z][A-Za-z0-9_.]*)\"$")).
		Report(`avoid non-canonical appended structured context keys; use lower camelCase with canonical acronym casing (for example "dashboardUID", "requestPath", "statusCode")`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|data|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|user|client|uname|type|value|info|panic)\"$")).
		Report(`avoid ambiguous keys in appended structured log arguments; use contextual keys such as "userID", "requestPath", "statusCode", "resourceKind", "datasourceType", "measurementValue", or "messageInfo"`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous key "reason" in appended structured log arguments; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous key "panic" in appended structured log arguments; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report(`avoid runtime-generated keys in appended structured log arguments; use stable string-literal or const keys and keep dynamic data in values`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, fmt.Sprintf($fmt, $*args), $*after)...)`,
		`$logger.Info($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, fmt.Sprint($*args), $*after)...)`,
	).
		Report(`avoid fmt formatting in appended structured log values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, $left + $right, $*after)...)`,
	).
		Where(m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in appended structured log values; pass typed values directly or split related data into separate structured fields`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in appended structured log keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`$logger.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.InfoCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.WarnCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.ErrorCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.DebugCtx($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Info($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Warn($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Error($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Debug($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.InfoContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.WarnContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.ErrorContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.DebugContext($ctx, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`slog.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`$logger.Log($ctx, $level, $msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.V($lvl).InfoS($msg, append($arr, $*before, $key, $value, $*after)...)`,
		`klog.ErrorS($baseErr, $msg, append($arr, $*before, $key, $value, $*after)...)`,
	).
		Where(m["key"].Text.Matches("^\"([A-Za-z_]+Uid|[A-Za-z0-9]+_[A-Za-z0-9_]+|.*\\s+.*|[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+|[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+|[A-Z][A-Za-z0-9_.]*)\"$")).
		Report(`avoid non-canonical appended structured log keys; use lower camelCase with canonical acronym casing (for example "dashboardUID", "requestPath", "statusCode")`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"func\"$")).
		Report(`avoid shorthand structured log key "func"; use "function" for clarity`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"statuscode\"$")).
		Report(`avoid non-canonical structured log key "statuscode"; use "statusCode"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous structured log key "panic"; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"status\"$") && m["value"].Text.Matches("(?:^|\\.)[A-Za-z0-9_]*StatusCode$|^statusCode$")).
		Report(`avoid logging HTTP response codes under key "status"; use "statusCode"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"status\"$") && m["value"].Text.Matches("^(res|resp|r)\\.Status$")).
		Report(`avoid logging HTTP status text under key "status"; use "statusText"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"response\"$") && m["value"].Text.Matches("^string\\(.*\\)$")).
		Report(`avoid generic key "response" for body text; use "responseBody"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report("prefer stable string-literal or const structured log keys; avoid runtime-generated key values")

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9.]+\\.(id|uid)\"$")).
		Report(`avoid lowercase dotted structured log key suffixes like ".id" or ".uid"; use canonical casing such as "userID" or "datasource.UID"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z0-9.]+\\.(id|uid)\"$")).
		Report(`avoid lowercase dotted structured log key suffixes like ".id" or ".uid"; use canonical casing such as "userID" or "datasource.UID"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case structured log keys; use camelCase with canonical acronym casing`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in structured log keys; use compact camelCase keys such as "rowsAffected" or "currentProvider"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated structured log keys; use camelCase keys such as "contentType" or "rowsAffected"`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted structured log keys; prefer flat camelCase keys with canonical acronym casing (for example "fileName", "identityUID")`)

	m.Match(
		`$logger.Info($msg, $*before, $key, $value, $*after)`,
		`$logger.Warn($msg, $*before, $key, $value, $*after)`,
		`$logger.Error($msg, $*before, $key, $value, $*after)`,
		`$logger.Debug($msg, $*before, $key, $value, $*after)`,
		`$logger.InfoCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.DebugCtx($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Info($msg, $*before, $key, $value, $*after)`,
		`slog.Warn($msg, $*before, $key, $value, $*after)`,
		`slog.Error($msg, $*before, $key, $value, $*after)`,
		`slog.Debug($msg, $*before, $key, $value, $*after)`,
		`slog.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`slog.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`$logger.Log($ctx, $level, $msg, $*before, $key, $value, $*after)`,
		`klog.InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.V($lvl).InfoS($msg, $*before, $key, $value, $*after)`,
		`klog.ErrorS($baseErr, $msg, $*before, $key, $value, $*after)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading structured log keys; use lower camelCase with canonical acronym casing (for example "orgID", "userEmail", "httpURL")`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && !m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report("prefer stable string-literal or const structured log keys; avoid runtime-generated key values")

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case structured log keys; use camelCase with canonical acronym casing`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in structured log keys; use compact camelCase keys such as "rowsAffected" or "currentProvider"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated structured log keys; use camelCase keys such as "contentType" or "rowsAffected"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && !m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report("prefer stable string-literal or const structured context keys; avoid runtime-generated key values")

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in structured logger context keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in structured logger context keys (for example "dashboardUID", "integrationUID")`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(userid|orgid|pluginid|traceid|panelpluginid|streamid|configid|datasourceid|dashboardid|panelid|querygroupid|migrationid|resourceversion)\"$")).
		Report(`avoid all-lowercase "…id" structured context keys; use canonical casing like "userID", "orgID", "pluginID", "traceID", "panelPluginID", "streamID", "configID"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason)\"$")).
		Report(`avoid ambiguous structured context keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "response", "code", "ids", "os", "file", "tag", "arm", "cc", "cxx", "arch", "repos", "tls", "status", "kind", "dir", "path", "url", or "reason"; use contextual keys such as "userID", "dashboardUID", "orgID", "configID", "queryText", "ruleUID", "checkRequest", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "resourceKind", "scopeKind", "eventKind", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "cacheKey", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "requestURL", "requestPath", "resourcePath", "streamPath", "folderPath", "appName", "pluginID", "requestBody", "responseBody", "statusCode", "statusText", "requestStatus", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", "temporaryFilePath", "containerTag", "tagFormat", "encodedTag", "goARM", "cCompiler", "cppCompiler", "architecture", "repositoryNames", "tlsEnabled", "directoryPath", or "artifactPath"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous structured context keys "user", "client", or "uname"; use specific keys such as "userID", "userLogin", "clientID", "authClient", or "authClientName"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous structured context key "type"; use contextual keys such as "datasourceType", "resourceType", "eventType", "identityType", "objectType", "secretType", or "keeperType"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous structured context key "value"; use contextual keys such as "configValue", "measurementValue", "sampleValue", "fieldValue", "headerValue", "argumentValue", "responseValue", or "kvValue"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous structured context key "info"; use contextual keys such as "messageInfo", "buildInfo", "runtimeInfo", "pluginInfo", or "userInfoData"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous structured context key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"data\"$")).
		Report(`avoid ambiguous structured context key "data"; use contextual keys such as "requestData", "responseData", "userData", or "payloadData"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"func\"$")).
		Report(`avoid shorthand structured context key "func"; use "function" for clarity`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"statuscode\"$")).
		Report(`avoid non-canonical structured context key "statuscode"; use "statusCode"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous structured context key "panic"; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z0-9.]+\\.(id|uid)\"$")).
		Report(`avoid lowercase dotted structured context key suffixes like ".id" or ".uid"; use canonical casing such as "userID" or "datasource.UID"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case structured context keys; use camelCase with canonical acronym casing`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in structured context keys; use compact camelCase keys such as "rowsAffected" or "currentProvider"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated structured context keys; use camelCase keys such as "contentType" or "rowsAffected"`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted structured context keys; prefer flat camelCase keys with canonical acronym casing (for example "fileName", "identityUID")`)

	m.Match(
		`$logger.New($*before, $key, $value, $*after)`,
		`$logger.With($*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading structured context keys; use lower camelCase with canonical acronym casing`)

	m.Match(
		`$logger.New($*before, "error", $err.Error(), $*after)`,
		`$logger.With($*before, "error", $err.Error(), $*after)`,
	).
		Where(isStructuredLogger && m["err"].Type.Is("error")).
		Report(`use "errorMessage" for stringified error text in structured context (for example logger.With("errorMessage", err.Error())); keep "error" for error objects`)

	m.Match(
		`$logger.New($*before, "error", $errMsg, $*after)`,
		`$logger.With($*before, "error", $errMsg, $*after)`,
	).
		Where(isStructuredLogger && !m["errMsg"].Type.Is("error") && !m["errMsg"].Type.Implements("error")).
		Report(`use "errorMessage" for stringified error text in structured context; keep "error" for error objects`)

	m.Match(
		`$logger.New($*before, "errorMessage", $errVal, $*after)`,
		`$logger.With($*before, "errorMessage", $errVal, $*after)`,
	).
		Where(isStructuredLogger && (m["errVal"].Type.Is("error") || m["errVal"].Type.Implements("error"))).
		Report(`use "error" for error objects in structured context; reserve "errorMessage" for textual error details`)

	m.Match(
		`$logger.New($*before, "errorMessage", $errVal, $*after)`,
		`$logger.With($*before, "errorMessage", $errVal, $*after)`,
	).
		Where(
			isStructuredLogger &&
				(m["errVal"].Type.Is("bool") ||
					m["errVal"].Type.Is("int") ||
					m["errVal"].Type.Is("int8") ||
					m["errVal"].Type.Is("int16") ||
					m["errVal"].Type.Is("int32") ||
					m["errVal"].Type.Is("int64") ||
					m["errVal"].Type.Is("uint") ||
					m["errVal"].Type.Is("uint8") ||
					m["errVal"].Type.Is("uint16") ||
					m["errVal"].Type.Is("uint32") ||
					m["errVal"].Type.Is("uint64") ||
					m["errVal"].Type.Is("float32") ||
					m["errVal"].Type.Is("float64")),
		).
		Report(`"errorMessage" in structured context should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for numeric/bool values`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(
			!m["key"].Const &&
				!m["key"].Text.Matches("^\".*\"$") &&
				!m["key"].Text.Matches("^attribute\\.Key\\(.*\\)$"),
		).
		Report(`prefer stable string-literal or const trace attribute keys in attribute.KeyValue literals; avoid runtime-generated key values`)

	m.Match(
		`attribute.KeyValue{Key: attribute.Key($inner), Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: attribute.Key($inner)}`,
		`attribute.KeyValue{attribute.Key($inner), $value}`,
	).
		Where(!m["inner"].Const && !m["inner"].Text.Matches("^\".*\"$")).
		Report(`prefer stable string-literal or const trace attribute keys in attribute.KeyValue literals; avoid runtime-generated key values inside attribute.Key(...) wrappers`)

	m.Match(
		`attribute.KeyValue{Key: $left + $right, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $left + $right}`,
		`attribute.KeyValue{$left + $right, $value}`,
		`attribute.KeyValue{Key: attribute.Key($left + $right), Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: attribute.Key($left + $right)}`,
		`attribute.KeyValue{attribute.Key($left + $right), $value}`,
	).
		Where(m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid dynamic concatenation for trace attribute keys in attribute.KeyValue literals; use stable string-literal keys and keep dynamic data in values`)

	m.Match(
		`attribute.KeyValue{Key: fmt.Sprintf($fmt, $*args), Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: fmt.Sprintf($fmt, $*args)}`,
		`attribute.KeyValue{fmt.Sprintf($fmt, $*args), $value}`,
		`attribute.KeyValue{Key: fmt.Sprint($*args), Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: fmt.Sprint($*args)}`,
		`attribute.KeyValue{fmt.Sprint($*args), $value}`,
		`attribute.KeyValue{Key: attribute.Key(fmt.Sprintf($fmt, $*args)), Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: attribute.Key(fmt.Sprintf($fmt, $*args))}`,
		`attribute.KeyValue{attribute.Key(fmt.Sprintf($fmt, $*args)), $value}`,
		`attribute.KeyValue{Key: attribute.Key(fmt.Sprint($*args)), Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: attribute.Key(fmt.Sprint($*args))}`,
		`attribute.KeyValue{attribute.Key(fmt.Sprint($*args)), $value}`,
	).
		Report(`avoid fmt formatting for trace attribute keys in attribute.KeyValue literals; use stable string-literal keys and keep dynamic data in values`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: attribute.StringValue(fmt.Sprintf($fmt, $*args))}`,
		`attribute.KeyValue{Value: attribute.StringValue(fmt.Sprintf($fmt, $*args)), Key: $key}`,
		`attribute.KeyValue{$key, attribute.StringValue(fmt.Sprintf($fmt, $*args))}`,
		`attribute.KeyValue{Key: $key, Value: attribute.StringValue(fmt.Sprint($*args))}`,
		`attribute.KeyValue{Value: attribute.StringValue(fmt.Sprint($*args)), Key: $key}`,
		`attribute.KeyValue{$key, attribute.StringValue(fmt.Sprint($*args))}`,
	).
		Report(`avoid fmt formatting in trace attribute string values in attribute.KeyValue literals; pass typed values directly or split related data into separate attributes`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: attribute.StringValue($left + $right)}`,
		`attribute.KeyValue{Value: attribute.StringValue($left + $right), Key: $key}`,
		`attribute.KeyValue{$key, attribute.StringValue($left + $right)}`,
	).
		Where(m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in trace attribute string values in attribute.KeyValue literals; pass typed values directly or split related data into separate attributes`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|msg|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|panic|user|client|uname|type|value|info|data)\"$|^attribute\\.Key\\(\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|msg|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|panic|user|client|uname|type|value|info|data)\"\\)$")).
		Report(`avoid ambiguous trace attribute keys in attribute.KeyValue literals; use contextual keys such as "userID", "receiverUID", "orgID", "configID", "queryText", "ruleUID", "requestBody", "resourceVersion", "repositoryName", "resourceKind", "statusCode", "requestPath", "datasourceURL", "messageInfo", "measurementValue", or "payloadData"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$|^attribute\\.Key\\(\"reason\"\\)$")).
		Report(`avoid ambiguous trace attribute key "reason" in attribute.KeyValue literals; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$|^attribute\\.Key\\(\"panic\"\\)$")).
		Report(`avoid ambiguous trace attribute key "panic" in attribute.KeyValue literals; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"(user|client|uname)\"$|^attribute\\.Key\\(\"(user|client|uname)\"\\)$")).
		Report(`avoid ambiguous trace attribute keys "user", "client", or "uname" in attribute.KeyValue literals; use specific keys such as "userID", "userLogin", "clientID", "clientName", or "authClientName"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"type\"$|^attribute\\.Key\\(\"type\"\\)$")).
		Report(`avoid ambiguous trace attribute key "type" in attribute.KeyValue literals; use contextual keys such as "datasourceType", "resourceType", "eventType", "identityType", or "objectType"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"value\"$|^attribute\\.Key\\(\"value\"\\)$")).
		Report(`avoid ambiguous trace attribute key "value" in attribute.KeyValue literals; use contextual keys such as "measurementValue", "fieldValue", "responseValue", "requestValue", or "configValue"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"info\"$|^attribute\\.Key\\(\"info\"\\)$")).
		Report(`avoid ambiguous trace attribute key "info" in attribute.KeyValue literals; use contextual keys such as "messageInfo", "runtimeInfo", "buildInfo", or "pluginInfo"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"data\"$|^attribute\\.Key\\(\"data\"\\)$")).
		Report(`avoid ambiguous trace attribute key "data" in attribute.KeyValue literals; use contextual keys such as "requestData", "responseData", "payloadData", or "userData"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$|^attribute\\.Key\\(\"[A-Za-z_]+Id\"\\)$")).
		Report(`prefer "ID" acronym casing in trace attribute keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$|^attribute\\.Key\\(\"[A-Za-z_]+Uid\"\\)$")).
		Report(`prefer "UID" acronym casing in trace attribute keys (for example "dashboardUID", "ruleUID", "datasourceUID")`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: attribute.IntValue($value)}`,
		`attribute.KeyValue{Value: attribute.IntValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.IntValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Int64Value($value)}`,
		`attribute.KeyValue{Value: attribute.Int64Value($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Int64Value($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.IntSliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.IntSliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.IntSliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Int64SliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.Int64SliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Int64SliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.BoolValue($value)}`,
		`attribute.KeyValue{Value: attribute.BoolValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.BoolValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.BoolSliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.BoolSliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.BoolSliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Float64Value($value)}`,
		`attribute.KeyValue{Value: attribute.Float64Value($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Float64Value($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Float64SliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.Float64SliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Float64SliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.StringSliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.StringSliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.StringSliceValue($value)}`,
	).
		Where(m["key"].Text.Matches("^\"error\"$|^attribute\\.Key\\(\"error\"\\)$")).
		Report(`avoid non-text trace attributes under key "error"; use contextual keys such as "errorCode", "errorCount", or "hasError", and reserve "errorMessage" for textual error details`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: attribute.IntValue($value)}`,
		`attribute.KeyValue{Value: attribute.IntValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.IntValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Int64Value($value)}`,
		`attribute.KeyValue{Value: attribute.Int64Value($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Int64Value($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.IntSliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.IntSliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.IntSliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Int64SliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.Int64SliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Int64SliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.BoolValue($value)}`,
		`attribute.KeyValue{Value: attribute.BoolValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.BoolValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.BoolSliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.BoolSliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.BoolSliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Float64Value($value)}`,
		`attribute.KeyValue{Value: attribute.Float64Value($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Float64Value($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.Float64SliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.Float64SliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.Float64SliceValue($value)}`,
		`attribute.KeyValue{Key: $key, Value: attribute.StringSliceValue($value)}`,
		`attribute.KeyValue{Value: attribute.StringSliceValue($value), Key: $key}`,
		`attribute.KeyValue{$key, attribute.StringSliceValue($value)}`,
	).
		Where(m["key"].Text.Matches("^\"errorMessage\"$|^attribute\\.Key\\(\"errorMessage\"\\)$")).
		Report(`"errorMessage" trace attributes should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for non-text values`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: attribute.StringValue($errMsg)}`,
		`attribute.KeyValue{Value: attribute.StringValue($errMsg), Key: $key}`,
		`attribute.KeyValue{$key, attribute.StringValue($errMsg)}`,
	).
		Where(m["key"].Text.Matches("^\"error\"$|^attribute\\.Key\\(\"error\"\\)$")).
		Report(`use "errorMessage" when storing string error text in trace attributes`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"error\"$|^attribute\\.Key\\(\"error\"\\)$")).
		Report(`avoid trace attribute key "error" in attribute.KeyValue literals; use "errorMessage" for textual details and contextual typed keys such as "errorCode", "errorCount", or "hasError" for non-text values`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"(userid|orgid|pluginid|traceid|panelpluginid|streamid|configid|datasourceid|dashboardid|panelid|querygroupid|migrationid|resourceversion)\"$|^attribute\\.Key\\(\"(userid|orgid|pluginid|traceid|panelpluginid|streamid|configid|datasourceid|dashboardid|panelid|querygroupid|migrationid|resourceversion)\"\\)$")).
		Report(`avoid all-lowercase "…id" trace attribute keys; use canonical casing like "userID", "orgID", "pluginID", "traceID", "panelID", "datasourceID", "queryGroupID", "migrationID", "resourceVersion", "configID"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"([A-Za-z0-9]+_[A-Za-z0-9_]+|.*\\s+.*|[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+|[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+|[A-Z][A-Za-z0-9_.]*)\"$|^attribute\\.Key\\(\"([A-Za-z0-9]+_[A-Za-z0-9_]+|.*\\s+.*|[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+|[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+|[A-Z][A-Za-z0-9_.]*)\"\\)$")).
		Report(`avoid non-canonical trace attribute keys in attribute.KeyValue literals; use lower camelCase with canonical acronym casing (for example "dashboardUID", "requestPath", "statusCode")`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"statuscode\"$|^attribute\\.Key\\(\"statuscode\"\\)$")).
		Report(`avoid non-canonical trace attribute key "statuscode"; use "statusCode"`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"identUID\"$|^attribute\\.Key\\(\"identUID\"\\)$")).
		Report(`avoid abbreviated trace attribute key "identUID"; use "identityUID" for clarity`)

	m.Match(
		`attribute.KeyValue{Key: $key, Value: $value}`,
		`attribute.KeyValue{Value: $value, Key: $key}`,
		`attribute.KeyValue{$key, $value}`,
	).
		Where(m["key"].Text.Matches("^\"func\"$|^attribute\\.Key\\(\"func\"\\)$")).
		Report(`avoid shorthand trace attribute key "func"; use "function" for clarity`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"error\"$")).
		Report(`avoid generic trace attribute key "error" in attribute.Key(...); use "errorMessage" for textual details and contextual typed keys such as "errorCode", "errorCount", or "hasError"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous trace attribute key "reason" in attribute.Key(...); use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous trace attribute key "panic" in attribute.Key(...); use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous trace attribute keys "user", "client", or "uname" in attribute.Key(...); use specific keys such as "userID", "userLogin", "clientID", "clientName", or "authClientName"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous trace attribute key "type" in attribute.Key(...); use contextual keys such as "datasourceType", "resourceType", "eventType", "identityType", or "objectType"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous trace attribute key "value" in attribute.Key(...); use contextual keys such as "measurementValue", "fieldValue", "responseValue", "requestValue", or "configValue"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous trace attribute key "info" in attribute.Key(...); use contextual keys such as "messageInfo", "runtimeInfo", "buildInfo", or "pluginInfo"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"data\"$")).
		Report(`avoid ambiguous trace attribute key "data" in attribute.Key(...); use contextual keys such as "requestData", "responseData", "payloadData", or "userData"`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"identUID\"$")).
		Report(`avoid abbreviated trace attribute key "identUID" in attribute.Key(...); use "identityUID" for clarity`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"func\"$")).
		Report(`avoid shorthand trace attribute key "func" in attribute.Key(...); use "function" for clarity`)

	m.Match(
		`attribute.Key($key)`,
	).
		Where(m["key"].Text.Matches("^\"statuscode\"$")).
		Report(`avoid non-canonical trace attribute key "statuscode" in attribute.Key(...); use "statusCode"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report("prefer stable string-literal or const trace attribute keys when using attribute.Key(...); avoid runtime-generated key values")

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|msg|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|panic|user|client|uname|type|value|info|data)\"$")).
		Report(`avoid ambiguous trace attribute keys in attribute.Key(...); use contextual keys such as "userID", "receiverUID", "orgID", "configID", "queryText", "ruleUID", "requestBody", "resourceVersion", "repositoryName", "resourceKind", "statusCode", "requestPath", "datasourceURL", "messageInfo", "measurementValue", or "payloadData"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous trace attribute key "reason" in attribute.Key(...); use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous trace attribute key "panic" in attribute.Key(...); use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous trace attribute keys "user", "client", or "uname" in attribute.Key(...); use specific keys such as "userID", "userLogin", "clientID", "clientName", or "authClientName"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous trace attribute key "type" in attribute.Key(...); use contextual keys such as "datasourceType", "resourceType", "eventType", "identityType", or "objectType"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous trace attribute key "value" in attribute.Key(...); use contextual keys such as "measurementValue", "fieldValue", "responseValue", "requestValue", or "configValue"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous trace attribute key "info" in attribute.Key(...); use contextual keys such as "messageInfo", "runtimeInfo", "buildInfo", or "pluginInfo"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"data\"$")).
		Report(`avoid ambiguous trace attribute key "data" in attribute.Key(...); use contextual keys such as "requestData", "responseData", "payloadData", or "userData"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"identUID\"$")).
		Report(`avoid abbreviated trace attribute key "identUID" in attribute.Key(...); use "identityUID" for clarity`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"func\"$")).
		Report(`avoid shorthand trace attribute key "func" in attribute.Key(...); use "function" for clarity`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"statuscode\"$")).
		Report(`avoid non-canonical trace attribute key "statuscode" in attribute.Key(...); use "statusCode"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in trace attribute keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in trace attribute keys (for example "dashboardUID", "ruleUID", "datasourceUID")`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"(userid|orgid|pluginid|traceid|panelpluginid|streamid|configid|datasourceid|dashboardid|panelid|querygroupid|migrationid|resourceversion)\"$")).
		Report(`avoid all-lowercase "…id" trace attribute keys in attribute.Key(...); use canonical casing like "userID", "orgID", "pluginID", "traceID", "panelID", "datasourceID", "queryGroupID", "migrationID", "resourceVersion", "configID"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9]+_[A-Za-z0-9_]+\"$")).
		Report(`avoid snake_case trace attribute keys; use camelCase with canonical acronym casing`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in trace attribute keys; use compact camelCase keys such as "rowsAffected" or "currentProvider"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated trace attribute keys; use camelCase keys such as "contentType" or "rowsAffected"`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted trace attribute keys; prefer flat camelCase keys with canonical acronym casing`)

	m.Match(
		`attribute.Key($key).String($value)`,
		`attribute.Key($key).Int($value)`,
		`attribute.Key($key).Int64($value)`,
		`attribute.Key($key).IntSlice($value)`,
		`attribute.Key($key).Int64Slice($value)`,
		`attribute.Key($key).Bool($value)`,
		`attribute.Key($key).BoolSlice($value)`,
		`attribute.Key($key).Float64($value)`,
		`attribute.Key($key).Float64Slice($value)`,
		`attribute.Key($key).StringSlice($value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading trace attribute keys; use lower camelCase with canonical acronym casing`)

	m.Match(
		`attribute.Key($left + $right)`,
	).
		Report("avoid dynamic concatenation for trace attribute keys in attribute.Key(...); use stable string-literal keys and keep dynamic data in values")

	m.Match(
		`attribute.Key(fmt.Sprintf($fmt, $*args))`,
		`attribute.Key(fmt.Sprint($*args))`,
	).
		Report("avoid fmt formatting for trace attribute keys in attribute.Key(...); use stable string-literal keys and keep dynamic data in values")

	m.Match(
		`attribute.String($left + $right, $value)`,
		`attribute.Int($left + $right, $value)`,
		`attribute.Int64($left + $right, $value)`,
		`attribute.IntSlice($left + $right, $value)`,
		`attribute.Int64Slice($left + $right, $value)`,
		`attribute.Bool($left + $right, $value)`,
		`attribute.BoolSlice($left + $right, $value)`,
		`attribute.Float64($left + $right, $value)`,
		`attribute.Float64Slice($left + $right, $value)`,
		`attribute.StringSlice($left + $right, $value)`,
	).
		Report("avoid dynamic concatenation for trace attribute keys; use stable string-literal keys and keep dynamic data in values")

	m.Match(
		`attribute.String(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.Int(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.Int64(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.IntSlice(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.Int64Slice(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.Bool(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.BoolSlice(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.Float64(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.Float64Slice(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.StringSlice(fmt.Sprintf($fmt, $*args), $value)`,
		`attribute.String(fmt.Sprint($*args), $value)`,
		`attribute.Int(fmt.Sprint($*args), $value)`,
		`attribute.Int64(fmt.Sprint($*args), $value)`,
		`attribute.IntSlice(fmt.Sprint($*args), $value)`,
		`attribute.Int64Slice(fmt.Sprint($*args), $value)`,
		`attribute.Bool(fmt.Sprint($*args), $value)`,
		`attribute.BoolSlice(fmt.Sprint($*args), $value)`,
		`attribute.Float64(fmt.Sprint($*args), $value)`,
		`attribute.Float64Slice(fmt.Sprint($*args), $value)`,
		`attribute.StringSlice(fmt.Sprint($*args), $value)`,
	).
		Report("avoid fmt formatting for trace attribute keys; use stable string-literal keys and keep dynamic data in values")

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(!m["key"].Const && !m["key"].Text.Matches("^\".*\"$")).
		Report("prefer stable string-literal or const trace attribute keys; avoid runtime-generated key values")

	m.Match(
		`attribute.String($key, fmt.Sprintf($fmt, $*args))`,
		`attribute.String($key, fmt.Sprint($*args))`,
		`attribute.Key($key).String(fmt.Sprintf($fmt, $*args))`,
		`attribute.Key($key).String(fmt.Sprint($*args))`,
	).
		Report(`avoid fmt formatting in trace attribute string values; pass typed values directly or split related data into separate attributes`)

	m.Match(
		`attribute.String($key, $left + $right)`,
		`attribute.Key($key).String($left + $right)`,
	).
		Report(`avoid string concatenation in trace attribute string values; pass typed values directly or split related data into separate attributes`)

	m.Match(
		`$attrKey.String(fmt.Sprintf($fmt, $*args))`,
		`$attrKey.String(fmt.Sprint($*args))`,
	).
		Where(m["attrKey"].Type.Is("go.opentelemetry.io/otel/attribute.Key")).
		Report(`avoid fmt formatting in trace attribute string values; pass typed values directly or split related data into separate attributes`)

	m.Match(
		`$attrKey.String($left + $right)`,
	).
		Where(m["attrKey"].Type.Is("go.opentelemetry.io/otel/attribute.Key") && m["left"].Type.Is("string") && m["right"].Type.Is("string")).
		Report(`avoid string concatenation in trace attribute string values; pass typed values directly or split related data into separate attributes`)

	m.Match(
		`$span.AddEvent("status")`,
		`$span.AddEvent("status", $*attrs)`,
	).
		Report(`avoid generic trace event name "status"; use contextual event names such as "queryStatus", "requestStatus", or "operationStatus"`)

	m.Match(
		`$span.AddEvent("query")`,
		`$span.AddEvent("query", $*attrs)`,
	).
		Report(`avoid generic trace event name "query"; use a contextual event name such as "queryExecuted", "queryStarted", or "queryFinished"`)

	m.Match(
		`$span.AddEvent("result")`,
		`$span.AddEvent("result", $*attrs)`,
		`$span.AddEvent("user")`,
		`$span.AddEvent("user", $*attrs)`,
		`$span.AddEvent("next")`,
		`$span.AddEvent("next", $*attrs)`,
		`$span.AddEvent("data")`,
		`$span.AddEvent("data", $*attrs)`,
	).
		Report(`avoid generic trace event names like "result", "user", "next", or "data"; use contextual names such as "rpcResult", "authenticatedUser", "bulkNext", or "payloadReceived"`)

	m.Match(
		`$span.AddEvent($name)`,
		`$span.AddEvent($name, $*attrs)`,
	).
		Where(m["name"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in trace event names; use lowerCamelCase literals such as "queryExecuted" or "indexUpdated"`)

	m.Match(
		`$span.AddEvent($name)`,
		`$span.AddEvent($name, $*attrs)`,
	).
		Where(m["name"].Text.Matches("^\"[A-Z].*\"$")).
		Report(`avoid PascalCase trace event names; use lowerCamelCase literals such as "queryDataStart" or "loadedRoute"`)

	m.Match(
		`$span.AddEvent($name)`,
		`$span.AddEvent($name, $*attrs)`,
	).
		Where(m["name"].Text.Matches("^\".*[_\\-.:/].*\"$")).
		Report(`avoid separator characters in trace event names; use lowerCamelCase literals such as "batchTransactionCompleted" or "resourceVersionLocked"`)

	m.Match(
		`$span.AddEvent($name)`,
		`$span.AddEvent($name, $*attrs)`,
	).
		Where(
			m["name"].Text.Matches("^\"[a-z0-9]+\"$") &&
				!m["name"].Text.Matches("^\"exception\"$"),
		).
		Report(`avoid generic single-word trace event names; use contextual lowerCamelCase literals such as "connectionLimitDisconnect" or "garbageCollectionCandidates"`)

	m.Match(
		`$span.AddEvent($left + $right)`,
		`$span.AddEvent($left + $right, $*attrs)`,
		`$span.AddEvent(fmt.Sprintf($fmt, $*args))`,
		`$span.AddEvent(fmt.Sprintf($fmt, $*args), $*attrs)`,
		`$span.AddEvent(fmt.Sprint($*args))`,
		`$span.AddEvent(fmt.Sprint($*args), $*attrs)`,
	).
		Report(`avoid dynamic trace event names; use stable string-literal names and keep dynamic data in attributes`)

	m.Match(
		`$span.AddEvent($name)`,
		`$span.AddEvent($name, $*attrs)`,
	).
		Where(!m["name"].Const && !m["name"].Text.Matches("^\".*\"$")).
		Report(`prefer stable string-literal or const trace event names; avoid runtime-generated event names`)

	m.Match(
		`attribute.Int("error", $value)`,
		`attribute.Int64("error", $value)`,
		`attribute.IntSlice("error", $value)`,
		`attribute.Int64Slice("error", $value)`,
		`attribute.Bool("error", $value)`,
		`attribute.BoolSlice("error", $value)`,
		`attribute.Float64("error", $value)`,
		`attribute.Float64Slice("error", $value)`,
		`attribute.StringSlice("error", $value)`,
	).
		Report(`avoid non-text trace attributes under key "error"; use contextual keys such as "errorCode", "errorCount", or "hasError", and reserve "errorMessage" for textual error details`)

	m.Match(
		`attribute.Int("errorMessage", $value)`,
		`attribute.Int64("errorMessage", $value)`,
		`attribute.IntSlice("errorMessage", $value)`,
		`attribute.Int64Slice("errorMessage", $value)`,
		`attribute.Bool("errorMessage", $value)`,
		`attribute.BoolSlice("errorMessage", $value)`,
		`attribute.Float64("errorMessage", $value)`,
		`attribute.Float64Slice("errorMessage", $value)`,
		`attribute.StringSlice("errorMessage", $value)`,
	).
		Report(`"errorMessage" trace attributes should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for non-text values`)

	m.Match(
		`attribute.Key("error").Int($value)`,
		`attribute.Key("error").Int64($value)`,
		`attribute.Key("error").IntSlice($value)`,
		`attribute.Key("error").Int64Slice($value)`,
		`attribute.Key("error").Bool($value)`,
		`attribute.Key("error").BoolSlice($value)`,
		`attribute.Key("error").Float64($value)`,
		`attribute.Key("error").Float64Slice($value)`,
		`attribute.Key("error").StringSlice($value)`,
	).
		Report(`avoid non-text trace attributes under key "error"; use contextual keys such as "errorCode", "errorCount", or "hasError", and reserve "errorMessage" for textual error details`)

	m.Match(
		`attribute.Key("errorMessage").Int($value)`,
		`attribute.Key("errorMessage").Int64($value)`,
		`attribute.Key("errorMessage").IntSlice($value)`,
		`attribute.Key("errorMessage").Int64Slice($value)`,
		`attribute.Key("errorMessage").Bool($value)`,
		`attribute.Key("errorMessage").BoolSlice($value)`,
		`attribute.Key("errorMessage").Float64($value)`,
		`attribute.Key("errorMessage").Float64Slice($value)`,
		`attribute.Key("errorMessage").StringSlice($value)`,
	).
		Report(`"errorMessage" trace attributes should be textual; use contextual typed keys such as "errorCode", "errorCount", or "hasError" for non-text values`)

	m.Match(
		`attribute.String("error", $errMsg)`,
	).
		Report(`use "errorMessage" when storing string error text in trace attributes`)

	m.Match(
		`attribute.Key("error").String($errMsg)`,
	).
		Report(`use "errorMessage" when storing string error text in trace attributes`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Id\"$")).
		Report(`prefer "ID" acronym casing in trace attribute keys (for example "orgID", "pluginID", "userID")`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z_]+Uid\"$")).
		Report(`prefer "UID" acronym casing in trace attribute keys (for example "dashboardUID", "ruleUID", "datasourceUID")`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"(userid|orgid|pluginid|traceid|panelpluginid|streamid|configid|datasourceid|dashboardid|panelid|querygroupid|migrationid|resourceversion)\"$")).
		Report(`avoid all-lowercase "…id" trace attribute keys; use canonical casing like "userID", "orgID", "pluginID", "traceID", "panelID", "datasourceID", "queryGroupID", "migrationID", "resourceVersion", "configID"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|msg|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|response|code|ids|os|file|tag|arm|cc|cxx|arch|repos|tls|status|kind|dir|path|url|reason|panic)\"$")).
		Report(`avoid ambiguous trace attribute keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "msg", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "response", "code", "ids", "os", "file", "tag", "arm", "cc", "cxx", "arch", "repos", "tls", "status", "kind", "dir", "path", "url", "reason", or "panic"; use contextual keys such as "userID", "receiverUID", "orgID", "configID", "queryText", "ruleUID", "requestBody", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "resourceKind", "scopeKind", "eventKind", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "message", "messageName", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "requestPath", "resourcePath", "datasourceURL", "appName", "pluginID", "responseBody", "statusCode", "statusText", "requestStatus", "queryStatus", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", "temporaryFilePath", "containerTag", "tagFormat", "encodedTag", "goARM", "cCompiler", "cppCompiler", "architecture", "repositoryNames", "tlsEnabled", or "directoryPath"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"(user|client|uname)\"$")).
		Report(`avoid ambiguous trace attribute keys "user", "client", or "uname"; use specific keys such as "userID", "userLogin", "clientID", "clientName", or "authClientName"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"type\"$")).
		Report(`avoid ambiguous trace attribute key "type"; use contextual keys such as "datasourceType", "resourceType", "eventType", "identityType", or "objectType"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"value\"$")).
		Report(`avoid ambiguous trace attribute key "value"; use contextual keys such as "measurementValue", "fieldValue", "responseValue", "requestValue", or "configValue"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"info\"$")).
		Report(`avoid ambiguous trace attribute key "info"; use contextual keys such as "messageInfo", "runtimeInfo", "buildInfo", or "pluginInfo"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"reason\"$")).
		Report(`avoid ambiguous trace attribute key "reason"; use contextual keys such as "failureReason", "shutdownReason", "skipReason", "validationReason", "stateReason", "disconnectReason", "evictionReason", "indexBuildReason", "updateReason", or "stopReason"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"panic\"$")).
		Report(`avoid ambiguous trace attribute key "panic"; use "panicValue" for recovered panic payloads, or contextual keys such as "panicState"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"data\"$")).
		Report(`avoid ambiguous trace attribute key "data"; use contextual keys such as "requestData", "responseData", "payloadData", or "userData"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"identUID\"$")).
		Report(`avoid abbreviated trace attribute key "identUID"; use "identityUID" for clarity`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"func\"$")).
		Report(`avoid shorthand trace attribute key "func"; use "function" for clarity`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"statuscode\"$")).
		Report(`avoid non-canonical trace attribute key "statuscode"; use "statusCode"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"identity\\.[A-Za-z0-9.]+\"$")).
		Report(`avoid dotted identity trace keys like "identity.ID"; use flattened camelCase keys such as "identityID" or "identityExternalUID"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9.]+\\.uid\"$")).
		Report(`avoid lowercase dotted trace key suffix ".uid"; use canonical "UID" casing (for example "datasource.UID")`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9.]+\\.id\"$")).
		Report(`avoid lowercase dotted trace key suffix ".id"; use canonical "ID" casing (for example "orgID")`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_]+(?:\\.[A-Za-z0-9_]+)+(?:ID|UID|IDs|UIDs)\"$")).
		Report(`avoid dotted trace keys ending in ID/UID segments; use flat camelCase keys such as "datasourceUID", "nodeRefID", or "supportBundleCollectorUID"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"org\\.id\"$")).
		Report(`avoid dotted lowercase trace key "org.id"; use canonical "orgID"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9.]*_[A-Za-z0-9_.]*\"$")).
		Report(`avoid snake_case trace attribute keys; use camelCase with canonical acronym casing`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\".*\\s+.*\"$")).
		Report(`avoid whitespace in trace attribute keys; use compact camelCase keys such as "rowsAffected" or "currentProvider"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_.-]+-[A-Za-z0-9_.-]+\"$")).
		Report(`avoid hyphenated trace attribute keys; use camelCase keys such as "contentType" or "rowsAffected"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Za-z0-9_]+\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted trace attribute keys; use flat camelCase keys with canonical acronym casing (for example "datasourceUID", "errorSource", "dashboardMetadataName")`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"[A-Z][A-Za-z0-9_.]*\"$")).
		Report(`avoid uppercase-leading trace attribute keys; use lower camelCase with canonical acronym casing`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"(job|repository|resource|stats)\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted provisioning trace keys like "job.name" or "resource.name"; use flat camelCase keys such as "jobName", "repositoryName", "resourceName", or "statsErrorMessage"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"dashboard\\.metadata\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted dashboard metadata trace keys like "dashboard.metadata.name"; use flat camelCase keys such as "dashboardMetadataName"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"fallback\\.[A-Za-z0-9_.]+\"$")).
		Report(`avoid dotted fallback trace keys like "fallback.storedVersion"; use flat camelCase keys such as "fallbackStoredVersion"`)

	m.Match(
		`attribute.String($key, $value)`,
		`attribute.Int($key, $value)`,
		`attribute.Int64($key, $value)`,
		`attribute.IntSlice($key, $value)`,
		`attribute.Int64Slice($key, $value)`,
		`attribute.Bool($key, $value)`,
		`attribute.BoolSlice($key, $value)`,
		`attribute.Float64($key, $value)`,
		`attribute.Float64Slice($key, $value)`,
		`attribute.StringSlice($key, $value)`,
	).
		Where(m["key"].Text.Matches("^\"error\\.source\"$")).
		Report(`avoid dotted trace key "error.source"; use flat camelCase key "errorSource"`)

	m.Match(
		`$logger.Debugf($*args)`,
		`$logger.Infof($*args)`,
		`$logger.Warnf($*args)`,
		`$logger.Errorf($*args)`,
	).
		Where(isStructuredLogger).
		Report("avoid formatted structured logger methods; use a stable message with key/value fields")
}

func unstructuredoutput(m fluent.Matcher) {
	m.Match(
		`print($*args)`,
		`println($*args)`,
		`fmt.Print($*args)`,
		`fmt.Printf($*args)`,
		`fmt.Println($*args)`,
		`fmt.Fprint(Stdout, $*args)`,
		`fmt.Fprintf(Stdout, $*args)`,
		`fmt.Fprintln(Stdout, $*args)`,
		`fmt.Fprint(Stderr, $*args)`,
		`fmt.Fprintf(Stderr, $*args)`,
		`fmt.Fprintln(Stderr, $*args)`,
		`fmt.Fprint(os.Stdout, $*args)`,
		`fmt.Fprintf(os.Stdout, $*args)`,
		`fmt.Fprintln(os.Stdout, $*args)`,
		`fmt.Fprint(os.Stderr, $*args)`,
		`fmt.Fprintf(os.Stderr, $*args)`,
		`fmt.Fprintln(os.Stderr, $*args)`,
	).Report("avoid fmt print helpers for logging/output; use structured logging or direct os.Stdout/os.Stderr writes for command output")

	m.Match(
		`log.Print($*args)`,
		`log.Printf($*args)`,
		`log.Println($*args)`,
		`log.Fatal($*args)`,
		`log.Fatalf($*args)`,
		`log.Fatalln($*args)`,
		`log.Panic($*args)`,
		`log.Panicf($*args)`,
		`log.Panicln($*args)`,
		`stdlog.Print($*args)`,
		`stdlog.Printf($*args)`,
		`stdlog.Println($*args)`,
		`stdlog.Fatal($*args)`,
		`stdlog.Fatalf($*args)`,
		`stdlog.Fatalln($*args)`,
		`stdlog.Panic($*args)`,
		`stdlog.Panicf($*args)`,
		`stdlog.Panicln($*args)`,
	).Report("avoid stdlib log print/fatal helpers; use structured logging and explicit exit handling where needed")

	m.Match(
		`$logger.Print($*args)`,
		`$logger.Printf($*args)`,
		`$logger.Println($*args)`,
		`$logger.Fatal($*args)`,
		`$logger.Fatalf($*args)`,
		`$logger.Fatalln($*args)`,
		`$logger.Panic($*args)`,
		`$logger.Panicf($*args)`,
		`$logger.Panicln($*args)`,
	).
		Where(m["logger"].Type.Is("*log.Logger") || m["logger"].Type.Is("log.Logger")).
		Report("avoid stdlib *log.Logger print/fatal helpers; use structured logging and explicit exit handling where needed")

	m.Match(
		`klog.Info($*args)`,
		`klog.Warning($*args)`,
		`klog.Error($*args)`,
		`klog.V($lvl).Info($*args)`,
		`klog.Infof($*args)`,
		`klog.Warningf($*args)`,
		`klog.Errorf($*args)`,
		`klog.Fatalf($*args)`,
		`klog.V($lvl).Infof($*args)`,
	).Report("avoid unstructured klog helpers; use structured klog methods (InfoS/ErrorS) with key/value fields")
}

func badlock(m fluent.Matcher) {
	// Shouldn't give many false positives without type filter
	// as Lock+Unlock pairs in combination with defer gives us pretty
	// a good chance to guess correctly. If we constrain the type to sync.Mutex
	// then it'll be harder to match embedded locks and custom methods
	// that may forward the call to the sync.Mutex (or other synchronization primitive).

	m.Match(`$mu.Lock(); defer $mu.RUnlock()`).Report(`maybe $mu.RLock() was intended?`)
	m.Match(`$mu.RLock(); defer $mu.Unlock()`).Report(`maybe $mu.Lock() was intended?`)
}
