package kinds

manifest: {
	appName: "annotation"
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
                    request: {
                        query: {
                            tag?: string
                            limit?: int64
                        }
                    }
                    response: {
                        tags: [...{
                            tag: string
                            count: number
                        }]
                    }
                }
            }
            "/search": {
                "GET": {
                    request: {
                        query: {
                            dashboardUID?:  string
                            panelID?:       int64
                            from?:          int64
                            to?:            int64
                            limit?:         int64 | 100
                            continue?:      string
                            tag?:           [...string]
                            tagsMatchAny?:  bool
                            scope?:         [...string]
                            scopesMatchAny?: bool
                        }
                    }
                    response: {
                        apiVersion: string
                        kind: string
                        items: [..._]
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
