-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDomain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FocusArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "area" TEXT,
    "severity" TEXT,
    "rating" INTEGER,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "allowFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT NOT NULL,
    "route" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "domainId" TEXT,
    "itemId" TEXT,
    "questId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "overallLevel" INTEGER NOT NULL DEFAULT 1,
    "itemsSaved" INTEGER NOT NULL DEFAULT 0,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "reflections" INTEGER NOT NULL DEFAULT 0,
    "questsCompleted" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "criteriaType" TEXT NOT NULL,
    "criteriaValue" INTEGER,
    "domainId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "seenAt" TIMESTAMP(3),

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerHandle" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncCursor" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncPreferences" JSONB,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT,
    "note" TEXT,
    "importSource" TEXT,
    "externalId" TEXT,
    "importMetadata" JSONB,
    "title" TEXT,
    "summary" TEXT,
    "tags" TEXT[],
    "type" TEXT,
    "category" TEXT,
    "rawContent" TEXT,
    "imageUrl" TEXT,
    "domainId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- CreateIndex
CREATE INDEX "Domain_name_idx" ON "Domain"("name");

-- CreateIndex
CREATE INDEX "UserDomain_userId_idx" ON "UserDomain"("userId");

-- CreateIndex
CREATE INDEX "UserDomain_domainId_idx" ON "UserDomain"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDomain_userId_domainId_key" ON "UserDomain"("userId", "domainId");

-- CreateIndex
CREATE INDEX "FocusArea_userId_idx" ON "FocusArea"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FocusArea_userId_domainId_key" ON "FocusArea"("userId", "domainId");

-- CreateIndex
CREATE UNIQUE INDEX "FocusArea_userId_priority_key" ON "FocusArea"("userId", "priority");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_kind_idx" ON "Feedback"("kind");

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");

-- CreateIndex
CREATE INDEX "XPEvent_userId_createdAt_idx" ON "XPEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "XPEvent_userId_action_idx" ON "XPEvent"("userId", "action");

-- CreateIndex
CREATE INDEX "XPEvent_domainId_idx" ON "XPEvent"("domainId");

-- CreateIndex
CREATE INDEX "XPEvent_itemId_idx" ON "XPEvent"("itemId");

-- CreateIndex
CREATE INDEX "XPEvent_userId_itemId_idx" ON "XPEvent"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_userId_idx" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_totalXp_idx" ON "UserStats"("totalXp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Badge_key_key" ON "Badge"("key");

-- CreateIndex
CREATE INDEX "Badge_key_idx" ON "Badge"("key");

-- CreateIndex
CREATE INDEX "Badge_domainId_idx" ON "Badge"("domainId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_seenAt_idx" ON "UserBadge"("userId", "seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "SocialConnection_userId_idx" ON "SocialConnection"("userId");

-- CreateIndex
CREATE INDEX "SocialConnection_provider_syncEnabled_idx" ON "SocialConnection"("provider", "syncEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "SocialConnection_userId_provider_key" ON "SocialConnection"("userId", "provider");

-- CreateIndex
CREATE INDEX "Item_userId_status_idx" ON "Item"("userId", "status");

-- CreateIndex
CREATE INDEX "Item_userId_createdAt_idx" ON "Item"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Item_userId_category_idx" ON "Item"("userId", "category");

-- CreateIndex
CREATE INDEX "Item_domainId_idx" ON "Item"("domainId");

-- CreateIndex
CREATE INDEX "Item_userId_status_createdAt_idx" ON "Item"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Item_userId_category_createdAt_idx" ON "Item"("userId", "category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Item_userId_domainId_createdAt_idx" ON "Item"("userId", "domainId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Item_userId_importSource_externalId_key" ON "Item"("userId", "importSource", "externalId");

-- AddForeignKey
ALTER TABLE "UserDomain" ADD CONSTRAINT "UserDomain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDomain" ADD CONSTRAINT "UserDomain_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusArea" ADD CONSTRAINT "FocusArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusArea" ADD CONSTRAINT "FocusArea_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPEvent" ADD CONSTRAINT "XPEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPEvent" ADD CONSTRAINT "XPEvent_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
