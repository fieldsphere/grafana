package navtreeimpl

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/search/model"
	starapi "github.com/grafana/grafana/pkg/services/star/api"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestBuildLabsNavLink(t *testing.T) {
	t.Run("returns nil for unsigned users", func(t *testing.T) {
		service := ServiceImpl{}
		reqCtx := &contextmodel.ReqContext{IsSignedIn: false}

		node := service.buildLabsNavLink(reqCtx)
		require.Nil(t, node)
	})

	t.Run("returns labs section for signed users", func(t *testing.T) {
		service := ServiceImpl{}
		service.cfg = &setting.Cfg{AppSubURL: "/grafana"}
		reqCtx := &contextmodel.ReqContext{IsSignedIn: true}

		node := service.buildLabsNavLink(reqCtx)
		require.NotNil(t, node)
		require.Equal(t, navtree.NavIDLabs, node.Id)
		require.Equal(t, "Labs", node.Text)
		require.Equal(t, "/grafana/labs", node.Url)
		require.True(t, node.IsNew)
		require.Len(t, node.Children, 1)
		require.Equal(t, "labs-feature-flags", node.Children[0].Id)
		require.Equal(t, "/grafana/labs/feature-flags", node.Children[0].Url)
	})
}

func TestBuildStarredItemsNavLinks(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{
			UserID: 1,
			OrgID:  1,
		},
		Context: &web.Context{Req: httpReq},
	}

	t.Run("Should return empty list when there are no starred dashboards", func(t *testing.T) {
		starClient := starapi.NewMockK8sClients(t)
		starClient.On("GetStars", reqCtx).Return([]string{}, nil)

		service := ServiceImpl{
			starClient: starClient,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Empty(t, navLinks)
	})

	t.Run("Should return nav links for starred dashboards", func(t *testing.T) {
		starClient := starapi.NewMockK8sClients(t)
		starClient.On("GetStars", reqCtx).Return([]string{"dashboard1", "dashboard2"}, nil)

		dashboardService := dashboards.NewFakeDashboardService(t)
		dashboardService.On("SearchDashboards", mock.Anything, mock.Anything).Return(model.HitList{
			{
				UID:   "dashboard1",
				Title: "Dashboard 1",
				URL:   "/d/dashboard1/",
			},
			{
				UID:   "dashboard2",
				Title: "Dashboard 2",
				URL:   "/d/dashboard2/",
			},
		}, nil)

		service := ServiceImpl{
			starClient:       starClient,
			dashboardService: dashboardService,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Len(t, navLinks, 2)

		require.Equal(t, "starred/dashboard1", navLinks[0].Id)
		require.Equal(t, "Dashboard 1", navLinks[0].Text)
		require.Equal(t, "/d/dashboard1/", navLinks[0].Url)
		require.Equal(t, "starred/dashboard2", navLinks[1].Id)
		require.Equal(t, "Dashboard 2", navLinks[1].Text)
		require.Equal(t, "/d/dashboard2/", navLinks[1].Url)
	})

	t.Run("Should limit to 50 starred dashboards", func(t *testing.T) {
		uids := make([]string, 60)
		dashboardList := make(model.HitList, 60)
		for i := 0; i < 60; i++ {
			uids[i] = fmt.Sprintf("dashboard%d", i)
			dashboardList[i] = &model.Hit{
				UID:   fmt.Sprintf("dashboard%d", i),
				Title: fmt.Sprintf("Dashboard %d", i),
				URL:   fmt.Sprintf("/d/dashboard%d/", i),
			}
		}

		starClient := starapi.NewMockK8sClients(t)
		starClient.On("GetStars", reqCtx).Return(uids, nil)

		dashboardService := dashboards.NewFakeDashboardService(t)
		dashboardService.On("SearchDashboards", mock.Anything, mock.Anything).Return(dashboardList, nil)

		service := ServiceImpl{
			starClient:       starClient,
			dashboardService: dashboardService,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Len(t, navLinks, 50)
	})

	t.Run("Should sort dashboards by title", func(t *testing.T) {
		starClient := starapi.NewMockK8sClients(t)
		starClient.On("GetStars", reqCtx).Return([]string{"dashboard1", "dashboard2", "dashboard3"}, nil)

		dashboardService := dashboards.NewFakeDashboardService(t)
		dashboardService.On("SearchDashboards", mock.Anything, mock.Anything).Return(model.HitList{
			{
				UID:   "dashboard1",
				Title: "C Dashboard",
				URL:   "/d/dashboard1/",
			},
			{
				UID:   "dashboard2",
				Title: "A Dashboard",
				URL:   "/d/dashboard2/",
			},
			{
				UID:   "dashboard3",
				Title: "B Dashboard",
				URL:   "/d/dashboard3/",
			},
		}, nil)

		service := ServiceImpl{
			starClient:       starClient,
			dashboardService: dashboardService,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Len(t, navLinks, 3)

		require.Equal(t, "A Dashboard", navLinks[0].Text)
		require.Equal(t, "B Dashboard", navLinks[1].Text)
		require.Equal(t, "C Dashboard", navLinks[2].Text)
	})
}
