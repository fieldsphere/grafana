---
name: code-review
description: Review code for quality, security, and Grafana patterns. Use when reviewing pull requests, examining code changes, or when the user asks for a code review.
---

# Code Review

## Quick Start

When reviewing code:

1. Check correctness and edge cases
2. Verify security (XSS, SQL injection, command injection)
3. Ensure tests cover the changes
4. Follow project patterns (see [STANDARDS.md](STANDARDS.md))

## Review Checklist

- [ ] Logic is correct and handles edge cases
- [ ] No security vulnerabilities
- [ ] Code follows project style
- [ ] Functions are focused and appropriately sized
- [ ] Error handling is adequate
- [ ] Tests cover the changes

## Feedback Format

- **Critical**: Must fix before merge
- **Suggestion**: Consider improving
- **Nice to have**: Optional enhancement

## Additional Resources

- For detailed coding standards, see [STANDARDS.md](STANDARDS.md)
- For example reviews, see [examples.md](examples.md)
