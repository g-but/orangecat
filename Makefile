SHELL := /bin/bash

.PHONY: help ho model-select claim ship

help:
	@echo "Orange Cat Agent Coordination:"
	@echo "  make ho MESSAGE='message'        - Quick handoff"
	@echo "  make model-select TASK='task'    - Get model recommendation"
	@echo "  make claim AGENT=model AREA=area SUMMARY=summary ETA=time"
	@echo "  make ship                        - Full test+deploy pipeline"

ho:
	@./scripts/ho.sh "$(MESSAGE)"

model-select:
	@./scripts/model-selector.sh "$(TASK)"

claim:
	@echo "🔒 Claiming task: $(AREA) for $(AGENT) (ETA: $(ETA))"
	@mkdir -p .agents/locks
	@echo "agent=$(AGENT)" > .agents/locks/$(subst /,_,$(AREA)).lock
	@echo "summary=$(SUMMARY)" >> .agents/locks/$(subst /,_,$(AREA)).lock
	@echo "eta=$(ETA)" >> .agents/locks/$(subst /,_,$(AREA)).lock
	@echo "claimed_at=$(shell date -u +%Y-%m-%dT%H:%M:%SZ)" >> .agents/locks/$(subst /,_,$(AREA)).lock
	@echo "✅ Task claimed! Lock: .agents/locks/$(subst /,_,$(AREA)).lock"

ship:
	@echo "🚀 Running full ship pipeline"
	@npm run ship
