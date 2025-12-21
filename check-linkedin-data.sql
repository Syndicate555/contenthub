-- Check what data is being extracted for LinkedIn posts
-- Run this query in your Supabase SQL editor

SELECT
  id,
  title,
  url,
  "imageUrl",
  "videoUrl",
  "documentUrl",
  "embedHtml",
  "createdAt"
FROM "Item"
WHERE source LIKE '%linkedin%'
ORDER BY "createdAt" DESC
LIMIT 10;
