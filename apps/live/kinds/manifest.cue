package live

manifest: {
	appName:       "live"
	groupOverride: "live.grafana.app"
	versions: {
		"v1alpha1": {
			codegen: {
				ts: {enabled: false}
				go: {enabled: true}
			}
			kinds: [
				channelV1alpha1,
			]
			routes: {
				// namespaced contains namespace-scoped resource routes for the version,
				// which are exposed as HTTP handlers on '<version>/namespaces/<namespace>/<route>'.
				namespaced: {
					"/something": {
						"GET": {
							name: "getSomething"
							response: {
								namespace: string
								message:   string
							}
							request: {
								query: {
									message?: string
								}
							}
						}
					}
					"/ws": {
						"GET": {
							name: "getWs"
							response: {
								status: string
							}
						}
					}
					"/list": {
						"GET": {
							name: "getList"
							response: {
								channels: [...]
							}
						}
					}
					"/push/{streamId}": {
						"GET": {
							name: "getPush"
							response: {
								status: string
							}
						}
						"POST": {
							name: "createPush"
							response: {
								status: string
							}
						}
					}
				}
			}
		}
	}
	roles: {}
}
