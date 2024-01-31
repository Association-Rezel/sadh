# COLORS
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

.DEFAULT:
	@$(MAKE) -s help

.PHONY: help
help:
	@echo ''
	@echo 'Les commandes disponibles sont :'
	@echo '  ${YELLOW}make install${RESET}     : ${GREEN}Installe les dependences.${RESET}'
	@echo '  ${YELLOW}make start-front${RESET} : ${GREEN}Start le front.${RESET}'
	@echo '  ${YELLOW}make start-back${RESET}  : ${GREEN}Start le back.${RESET}'
	@echo '  ${YELLOW}make types${RESET}       : ${GREEN}Check les types du front.${RESET}'
	@echo '  ${YELLOW}make seed${RESET}        : ${GREEN}Prepare les BDDs.${RESET}'
	@echo ''

###################
# INSTALL

.PHONY: install
install: i-back i-front
	@echo ''
	@echo '  ${YELLOW}Done !${RESET}'
	@echo ''


back/.venv:
	@bash -c 'cd back && python3.11 -m venv .venv'

.PHONY: i-back
i-back: back/.venv
	@bash -c 'cd back && source .venv/bin/activate && pip install -r requirements.txt'

.PHONY: i-front
i-front:
	@bash -c 'cd front && npm install'

###################
# RUN

.PHONY: up
up:
	@bash -c 'docker compose -f infra/docker-compose.yaml up -d --wait'

.PHONY: down
down:
	@bash -c 'docker compose -f infra/docker-compose.yaml down'

.PHONY: down-v
down-v:
	@bash -c 'docker compose -f infra/docker-compose.yaml down -v'

.PHONY: start-back
start-back: up
	@bash -c 'cd back && source .venv/bin/activate && python -m uvicorn --factory back:make_app --reload --port 8000 --log-level debug'

.PHONY: start-front
start-front:
	@bash -c 'cd front && npm run dev'

.PHONY: types
types:
	@bash -c 'cd front && npm run types'

###################
# Seed

.PHONY: seed
seed:
	@bash infra/seed-kc.sh
