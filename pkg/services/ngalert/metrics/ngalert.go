package metrics

import (
	dskitmetrics "github.com/grafana/dskit/metrics"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/prometheus/client_golang/prometheus"
)

const (
	GrafanaBackend = "grafana"
	ProxyBackend   = "proxy"
	Namespace      = "grafana"
	Subsystem      = "alerting"
)

// ProvideService is a Metrics factory.
func ProvideService(r prometheus.Registerer) *NGAlert {
	return NewNGAlert(r)
}

type NGAlert struct {
	// Registerer is used by subcomponents which register their own metrics.
	Registerer prometheus.Registerer

	schedulerMetrics             *Scheduler
	stateMetrics                 *State
	multiOrgAlertmanagerMetrics  *MultiOrgAlertmanager
	apiMetrics                   *API
	historianMetrics             *Historian
	notificationHistorianMetrics *NotificationHistorian
	remoteAlertmanagerMetrics    *RemoteAlertmanager
	remoteWriterMetrics          *RemoteWriter
	senderMetrics                *Sender
}

// NewNGAlert manages the metrics of all the alerting components.
func NewNGAlert(r prometheus.Registerer) *NGAlert {
	tenantRegistries := dskitmetrics.NewTenantRegistries(log.New("ngalert.multiorg.alertmanager.metrics"))
	return &NGAlert{
		Registerer:                   r,
		schedulerMetrics:             NewSchedulerMetrics(r),
		stateMetrics:                 NewStateMetrics(r),
		multiOrgAlertmanagerMetrics:  NewMultiOrgAlertmanagerMetrics(r, tenantRegistries),
		apiMetrics:                   NewAPIMetrics(r),
		historianMetrics:             NewHistorianMetrics(r, Subsystem),
		notificationHistorianMetrics: NewNotificationHistorianMetrics(r),
		remoteAlertmanagerMetrics:    NewRemoteAlertmanagerMetrics(r),
		remoteWriterMetrics:          NewRemoteWriterMetrics(r),
		senderMetrics:                NewSenderMetrics(r),
	}
}

func (ng *NGAlert) GetSchedulerMetrics() *Scheduler {
	return ng.schedulerMetrics
}

func (ng *NGAlert) GetStateMetrics() *State {
	return ng.stateMetrics
}

func (ng *NGAlert) GetAPIMetrics() *API {
	return ng.apiMetrics
}

func (ng *NGAlert) GetMultiOrgAlertmanagerMetrics() *MultiOrgAlertmanager {
	return ng.multiOrgAlertmanagerMetrics
}

func (ng *NGAlert) GetHistorianMetrics() *Historian {
	return ng.historianMetrics
}

func (ng *NGAlert) GetNotificationHistorianMetrics() *NotificationHistorian {
	return ng.notificationHistorianMetrics
}

func (ng *NGAlert) GetRemoteAlertmanagerMetrics() *RemoteAlertmanager {
	return ng.remoteAlertmanagerMetrics
}

func (ng *NGAlert) GetRemoteWriterMetrics() *RemoteWriter {
	return ng.remoteWriterMetrics
}

func (ng *NGAlert) GetSenderMetrics() *Sender {
	return ng.senderMetrics
}
