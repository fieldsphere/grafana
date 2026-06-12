package kinds

manifest: {
	appName:       "annotation"
	groupOverride: "annotation.grafana.app"
	versions: {
		"v0alpha1": v0alpha1
	}
	roles: {}
}

v0alpha1: {
	kinds: [annotationv0alpha1]
	routes: {
		namespaced: {
			"/tags": {
				"GET": {
					name: "getTags"
					request: {
						query: {
							prefix?: string
							limit?:  int64 | 100
						}
					}
					response: {
						tags: [...{
							tag:   string
							count: number
						}]
					}
				}
			}
			"/search": {
				"GET": {
					name: "getSearch"
					request: {
						query: {
							from?:           int64
							to?:             int64
							limit?:          int64 | 100
							continue?:       string
							dashboardUID?:   string
							panelID?:        int64
							tag?:            [...string]
							tagsMatchAny?:   bool
							scope?:          [...string]
							scopesMatchAny?: bool
							createdBy?:      string
							legacyID?:       int64
						}
					}
					response: {
						apiVersion: string
						kind:       string
						items: [...]
					}
				}
			}
		}
	}
	codegen: {
		ts: {
			enabled: true
		}
		go: {
			enabled: true
		}
	}
}
