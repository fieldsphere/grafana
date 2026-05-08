package navtreeimpl

import (
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
)

func (s *ServiceImpl) buildLabsNavLink(c *contextmodel.ReqContext) *navtree.NavLink {
	hasAccess := ac.HasAccess(s.accessControl, c)
	if !hasAccess(ac.EvalPermission(ac.ActionSettingsRead, ac.ScopeSettingsAll)) {
		return nil
	}

	baseURL := s.cfg.AppSubURL + "/labs"

	return &navtree.NavLink{
		Text:       "Labs",
		Id:         navtree.NavIDLabs,
		SubTitle:   "Experimental tools and feature toggle visibility",
		Icon:       "cube",
		Url:        baseURL,
		SortWeight: navtree.WeightLabs,
		IsNew:      true,
		Children: []*navtree.NavLink{
			{
				Id:       "labs/feature-flags",
				Text:     "Feature flags",
				SubTitle: "View Grafana feature toggle state",
				Url:      baseURL + "/feature-flags",
			},
		},
	}
}
