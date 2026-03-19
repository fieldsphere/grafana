# Code Review Examples

## Example 1: Security fix

**Before**: Raw user input in SQL
```go
query := "SELECT * FROM users WHERE id = " + userInput
```

**After**: Parameterized query
```go
query := "SELECT * FROM users WHERE id = ?"
db.Query(query, userInput)
```

## Example 2: Handler vs service

**Avoid**: Business logic in handler
```go
func (h *Handler) GetUser(c *contextmodel.ReqContext) {
    user := h.db.GetUser(c.Params("id"))
    user.Permissions = computePermissions(user)  // logic in handler
    c.JSON(200, user)
}
```

**Prefer**: Delegate to service
```go
func (h *Handler) GetUser(c *contextmodel.ReqContext) {
    user, err := h.userService.GetByID(c.Req.Context(), c.Params("id"))
    if err != nil { ... }
    c.JSON(200, user)
}
```

## Example 3: Frontend data fetching

**Prefer**: RTK Query
```ts
const { data, isLoading } = useGetUserQuery(userId);
```

**Avoid**: Manual fetch in useEffect without caching
