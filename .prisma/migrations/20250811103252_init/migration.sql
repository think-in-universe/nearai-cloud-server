-- CreateTable
CREATE TABLE "public"."NearAi_MessageSignatures" (
    "model_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "signing_address" TEXT NOT NULL,
    "signing_algo" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NearAi_MessageSignatures_pkey" PRIMARY KEY ("chat_id","signing_algo")
);
