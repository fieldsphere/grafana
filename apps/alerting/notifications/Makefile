include ../../sdk.mk
include ../metadata.mk

ALERTING_APP := notifications

.PHONY: generate # Run Grafana App SDK code generation
generate: install-app-sdk update-app-sdk
	@$(APP_SDK_BIN) generate --source=./kinds/
	$(MAKE) gen-common-metadata
