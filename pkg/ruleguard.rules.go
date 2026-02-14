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
		Where(m["errMsg"].Type.Is("string")).
		Report("use \"errorMessage\" for string error text, or pass an error value as \"error\", err")

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
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|code|ids|os|file)\"$")).
		Report(`avoid ambiguous structured log keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "code", "ids", "os", or "file"; use contextual keys such as "userID", "dashboardUID", "orgID", "configID", "queryText", "ruleUID", "checkRequest", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "cacheKey", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "appName", "pluginID", "requestBody", "responseBody", "statusCode", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", or "temporaryFilePath"`)

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
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|code|ids|os|file)\"$")).
		Report(`avoid ambiguous structured log keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "code", "ids", "os", or "file"; use contextual keys such as "userID", "dashboardUID", "orgID", "configID", "queryText", "ruleUID", "checkRequest", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "cacheKey", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "appName", "pluginID", "requestBody", "responseBody", "statusCode", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", or "temporaryFilePath"`)

	m.Match(
		`$logger.DebugContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.InfoContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.WarnContext($ctx, $msg, $*before, $key, $value, $*after)`,
		`$logger.ErrorContext($ctx, $msg, $*before, $key, $value, $*after)`,
	).
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(user|client|uname)\"$")).
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
		Where(isStructuredLogger && m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|code|ids|os|file)\"$")).
		Report(`avoid ambiguous structured context keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "code", "ids", "os", or "file"; use contextual keys such as "userID", "dashboardUID", "orgID", "configID", "queryText", "ruleUID", "checkRequest", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "cacheKey", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "appName", "pluginID", "requestBody", "responseBody", "statusCode", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", or "temporaryFilePath"`)

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
		`attribute.String("error", $err.Error())`,
	).
		Where(m["err"].Type.Is("error")).
		Report(`use "errorMessage" for stringified error text in trace attributes (for example attribute.String("errorMessage", err.Error()))`)

	m.Match(
		`attribute.String("error", $errMsg)`,
	).
		Where(m["errMsg"].Type.Is("string")).
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
		Where(m["key"].Text.Matches("^\"(id|uid|org|cfg|query|rule|request|ns|rv|repo|repository|template|sql|args|name|job|action|check|guid|pid|pr|ref|msg|key|ctx|val|var|gv|gvr|ha|addr|alg|raw|sub|ip|hit|uri|app|body|code|ids|os|file)\"$")).
		Report(`avoid ambiguous trace attribute keys like "id", "uid", "org", "cfg", "query", "rule", "request", "ns", "rv", "repo", "repository", "template", "sql", "args", "name", "job", "action", "check", "guid", "pid", "pr", "ref", "msg", "key", "ctx", "val", "var", "gv", "gvr", "ha", "addr", "alg", "raw", "sub", "ip", "hit", "uri", "app", "body", "code", "ids", "os", or "file"; use contextual keys such as "userID", "receiverUID", "orgID", "configID", "queryText", "ruleUID", "requestBody", "namespace", "resourceVersion", "repositoryName", "templateName", "sqlQuery", "commandArgs", "sqlArgs", "messageArgs", "resourceName", "jobName", "permissionAction", "resourceAction", "routeAction", "checkName", "checkID", "resourceGUID", "processID", "pullRequestNumber", "gitRef", "queryRefID", "referenceKey", "message", "messageName", "resourceKey", "objectKey", "evaluationContextJSON", "timestampValue", "envVarKey", "groupVersion", "groupVersionResource", "highAvailabilityEnabled", "clientAddress", "algorithm", "rawMessage", "userSubject", "clientIP", "cacheHit", "requestURI", "appName", "pluginID", "responseBody", "statusCode", "filePath", "fileName", "configFilePath", "traceFilePath", "dashboardFilePath", "inputFilePath", "outputFilePath", "snapshotFileName", or "temporaryFilePath"`)

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
