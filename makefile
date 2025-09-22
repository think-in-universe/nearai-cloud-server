migrations/litellm/pull:
	@prisma db pull --schema .prisma/litellm.schema.prisma

migrations/nearai-cloud/dev:
	@prisma migrate dev --schema .prisma/nearai-cloud.schema.prisma --skip-generate

migrations/nearai-cloud/deploy:
	@prisma migrate deploy --schema .prisma/nearai-cloud.schema.prisma


phala/create:
	@rm -rf .phala && env-cmd -f .env-phala tsx scripts/create

phala/replicate:
	@rm -rf .phala && env-cmd -f .env-phala tsx scripts/replicate

phala/upgrade:
	@env-cmd -f .env-phala tsx scripts/upgrade
