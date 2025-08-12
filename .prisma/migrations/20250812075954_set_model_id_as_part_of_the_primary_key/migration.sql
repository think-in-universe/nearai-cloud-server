/*
  Warnings:

  - The primary key for the `NearAi_MessageSignatures` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."NearAi_MessageSignatures" DROP CONSTRAINT "NearAi_MessageSignatures_pkey",
ADD CONSTRAINT "NearAi_MessageSignatures_pkey" PRIMARY KEY ("model_id", "chat_id", "signing_algo");
