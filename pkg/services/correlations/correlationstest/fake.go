package correlationstest

import (
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/services/accesscontrol/acimpl"
	"github.com/grafana/grafana/pkg/services/correlations"
	"github.com/grafana/grafana/pkg/services/datasources"
	fakeDatasources "github.com/grafana/grafana/pkg/services/datasources/fakes"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/quota/quotatest"
	"github.com/grafana/grafana/pkg/setting"
)

func New(db db.DB, cfg *setting.Cfg, bus bus.Bus) *correlations.CorrelationsService {
	ds := &fakeDatasources.FakeDataSourceService{
		DataSources: []*datasources.DataSource{
			{ID: 1, UID: "graphite", Type: datasources.DS_GRAPHITE},
		},
	}

	features := featuremgmt.WithFeatures()
	correlationsSvc, _ := correlations.ProvideService(db, routing.NewRouteRegister(), ds, acimpl.ProvideAccessControl(features), bus, quotatest.New(false, nil), cfg, features, nil)
	return correlationsSvc
}
