-- W1 Database slice — StoreVisit model
-- Migration: 20260828000000_add_storevisit
--
-- Adds the first-party visit-tracking table.
-- All FK columns are nullable so visits are recorded for both
-- authenticated users (userId SET) and anonymous guests (userId NULL),
-- and for product-page visits (productId SET) or non-product pages
-- (productId NULL).  OnDelete: SET NULL preserves visit history if a user
-- account or product record is deleted (analytics must not be orphaned).
--
-- Reproducible apply command:
--   npx prisma db push --schema=prisma/schema.prisma
-- Prisma client regeneration:
--   npx prisma generate --schema=prisma/schema.prisma

CREATE TABLE `storevisit` (
    `id`        VARCHAR(191)  NOT NULL,
    `userId`    VARCHAR(191)  NULL,
    `productId` VARCHAR(191)  NULL,
    `sessionId` VARCHAR(191)  NULL,
    `path`      VARCHAR(191)  NOT NULL,
    `referrer`  VARCHAR(191)  NULL,
    `userAgent` LONGTEXT      NULL,
    `ipHash`    VARCHAR(191)  NULL,
    `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    -- Temporal range queries per user (profile / analytics)
    INDEX `StoreVisit_userId_createdAt_idx` (`userId`, `createdAt`),
    -- Temporal range queries per product (top-viewed analytics)
    INDEX `StoreVisit_productId_createdAt_idx` (`productId`, `createdAt`),
    -- Session-scoped visit reconstruction
    INDEX `StoreVisit_sessionId_idx` (`sessionId`),
    -- Global time-series analytics (new-vs-returning, daily unique sessions)
    INDEX `StoreVisit_createdAt_idx` (`createdAt`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FK: nullable user relation (SET NULL on user delete)
ALTER TABLE `storevisit`
    ADD CONSTRAINT `StoreVisit_userId_fkey`
    FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- FK: nullable product relation (SET NULL on product delete)
ALTER TABLE `storevisit`
    ADD CONSTRAINT `StoreVisit_productId_fkey`
    FOREIGN KEY (`productId`)
    REFERENCES `product` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
