ALERTING_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
GEN_METADATA := go run $(ALERTING_ROOT)/hack/gen-metadata

.PHONY: gen-common-metadata
gen-common-metadata:
	@$(GEN_METADATA) --app=$(ALERTING_APP)
