-- Check imported Pinterest items
SELECT
  id,
  title,
  url,
  "importSource",
  "externalId",
  "imageUrl",
  "importMetadata",
  "createdAt"
FROM "Item"
WHERE "importSource" = 'pinterest'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Expected result:
-- - Multiple rows with importSource = 'pinterest'
-- - externalId should be Pinterest pin IDs (numbers)
-- - imageUrl should have Pinterest CDN URLs (i.pinimg.com)
-- - importMetadata should be JSON object with:
--   {
--     "boardId": "...",
--     "boardName": "...",
--     "pinUrl": "https://pinterest.com/pin/...",
--     "mediaUrl": "...",
--     "isImageOnly": true/false,
--     "destinationUrl": "..." or null,
--     "altText": "..."
--   }

-- Check for duplicates (should be none)
SELECT "externalId", COUNT(*) as count
FROM "Item"
WHERE "importSource" = 'pinterest'
GROUP BY "externalId"
HAVING COUNT(*) > 1;

-- Expected: No results (no duplicates)
