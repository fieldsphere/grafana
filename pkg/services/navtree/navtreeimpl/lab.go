package navtreeimpl

import (
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
)

func (s *ServiceImpl) buildLabNavLink(c *contextmodel.ReqContext) *navtree.NavLink {
	children := []*navtree.NavLink{
		{
			Text:     "Feature toggles",
			SubTitle: "View and manage feature flags",
			Id:       "lab-feature-toggles",
			Url:      s.cfg.AppSubURL + "/lab/feature-toggles",
			Icon:     "toggle-on",
		},
	}

	return &navtree.NavLink{
		Text:       "Lab",
		SubTitle:   "Experimental features and feature flags",
		Id:         navtree.NavIDLab,
		Icon:       "bolt",
		Url:        s.cfg.AppSubURL + "/lab",
		SortWeight: navtree.WeightLab,
		Children:   children,
		IsNew:      true,
	}
}
