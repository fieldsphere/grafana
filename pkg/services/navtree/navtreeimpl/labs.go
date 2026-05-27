package navtreeimpl

import (
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
)

func (s *ServiceImpl) buildLabsNavLink(c *contextmodel.ReqContext) *navtree.NavLink {
	if !c.IsSignedIn {
		return nil
	}
	hasAccess := ac.HasAccess(s.accessControl, c)
	if !hasAccess(ac.EvalPermission(ac.ActionFeatureManagementRead)) {
		return nil
	}

	baseURL := s.cfg.AppSubURL + "/labs"
	children := []*navtree.NavLink{
		{
			Id:       "labs-feature-flags",
			Text:     "Feature flags",
			SubTitle: "View which Grafana feature toggles are enabled for this instance",
			Url:      baseURL + "/feature-flags",
			Icon:     "sliders-v-alt",
		},
	}

	return &navtree.NavLink{
		Text:       "Labs",
		Id:         navtree.NavIDLabs,
		SubTitle:   "Experimental tools and internal feature visibility",
		Icon:       "flask",
		Url:        baseURL,
		Children:   children,
		SortWeight: navtree.WeightLabs,
		IsNew:      true,
	}
}
