package org

import (
	"strconv"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
)

func hasGlobalAction(u identity.Requester, action string) bool {
	if u == nil {
		return false
	}
	return accesscontrol.EvalPermission(action).Evaluate(u.GetGlobalPermissions())
}

func hasAction(u identity.Requester, action string) bool {
	if u == nil {
		return false
	}
	if hasGlobalAction(u, action) {
		return true
	}
	return accesscontrol.EvalPermission(action).Evaluate(u.GetPermissions())
}

func isSelfUser(u identity.Requester, ref string) bool {
	if u == nil || ref == "" {
		return false
	}
	if ref == u.GetRawIdentifier() {
		return true
	}
	id, err := u.GetInternalID()
	if err != nil {
		return false
	}
	return strconv.FormatInt(id, 10) == ref
}
