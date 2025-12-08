-- Run this in your database to verify the connection was created
-- (Use Prisma Studio, pgAdmin, or psql)

SELECT
  id,
  provider,
  "providerHandle",
  "syncEnabled",
  scopes,
  "tokenExpiry",
  "createdAt"
FROM "SocialConnection"
WHERE provider = 'pinterest';

-- Expected result:
-- - One row with provider = 'pinterest'
-- - providerHandle should be your Pinterest username
-- - syncEnabled should be true
-- - scopes should be ['boards:read', 'pins:read', 'user_accounts:read']
-- - tokenExpiry should be a future date
-- - accessToken should be encrypted (long encrypted string)
