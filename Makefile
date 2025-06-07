redis:
	docker compose up -d bull-scheduler-redis

redis-stop:
	docker compose down bull-scheduler-redis

