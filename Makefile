# Makefile for QuantV1 Dashboard Portal

.PHONY: help dev serve build start docker-build docker-up docker-down docker-logs docker-restart docker-clean

# Default target showing help
help:
	@echo "Available commands:"
	@echo "Local Development:"
	@echo "  make dev             - Start local development server (alias for serve)"
	@echo "  make serve           - Start local development server"
	@echo "  make build           - Build local production bundle"
	@echo "  make start           - Start local production server"
	@echo ""
	@echo "Docker Operations:"
	@echo "  make docker-build    - Build Docker image using docker-compose"
	@echo "  make docker-up       - Build and start Docker container in background"
	@echo "  make docker-down     - Stop and remove Docker containers"
	@echo "  make docker-logs     - View Docker container logs"
	@echo "  make docker-restart  - Restart Docker container"
	@echo "  make docker-clean    - Remove Docker containers, volumes and local images"

# Local Development Targets
dev: serve

serve:
	npm run dev

build:
	npm run build

start:
	npm run start

# Docker Targets
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-restart:
	docker compose restart

docker-clean:
	docker compose down --rmi local --volumes --remove-orphans
