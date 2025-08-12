migrations/litellm/pull:
	@prisma db pull --schema .prisma/litellm.schema.prisma

migrations/nearai-cloud/dev:
	@prisma migrate dev --schema .prisma/nearai-cloud.schema.prisma --skip-generate

migrations/nearai-cloud/deploy:
	@prisma migrate deploy --schema .prisma/nearai-cloud.schema.prisma
