package navtreeimpl

import (
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/org"
)

func (s *ServiceImpl) buildLabsNavLink(c *contextmodel.ReqContext) *navtree.NavLink {
	if !c.IsSignedIn || !c.HasRole(org.RoleAdmin) {
		return nil
	}

	return &navtree.NavLink{
		Text:       "Labs",
		Id:         "labs",
		SubTitle:   "Preview and experimental feature flags",
		Icon:       "flask",
		Url:        s.cfg.AppSubURL + "/labs",
		SortWeight: navtree.WeightDataConnections + 50,
		IsNew:      true,
	}
}
