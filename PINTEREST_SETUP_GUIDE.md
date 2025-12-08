# Pinterest Integration Setup Guide

## Current Status: ❌ Not Configured

You're seeing the error `oauth_init_failed` because the Pinterest OAuth credentials are not yet configured.

---

## Quick Setup (5 Minutes)

### Step 1: Create Pinterest Developer App

1. **Visit**: https://developers.pinterest.com/apps/

2. **Sign in** with your Pinterest account

3. **Click "Create App"** button

4. **Fill in the form**:
   ```
   App name: ContentHub
   App description: Content management and bookmarking platform
   App website: http://localhost:3000
   ```

5. **Click "Create"** button

---

### Step 2: Configure Redirect URI ⚠️ CRITICAL!

In your newly created app's settings page:

1. Scroll to **"Redirect URIs"** section

2. Click **"Add"** button

3. **Enter EXACTLY** (copy-paste this):
   ```
   http://localhost:3000/api/auth/pinterest/callback
   ```

4. **Click "Save Settings"**

**⚠️ Important**: The redirect URI must match EXACTLY:
- Must start with `http://` (not `https://` for localhost)
- Must include `/api/auth/pinterest/callback` path
- No trailing slash
- Port must match (3000)

**Common mistakes**:
- ❌ `https://localhost:3000/api/auth/pinterest/callback` (wrong protocol)
- ❌ `http://localhost:3000/api/auth/pinterest/callback/` (trailing slash)
- ❌ `http://localhost:3001/api/auth/pinterest/callback` (wrong port)
- ✅ `http://localhost:3000/api/auth/pinterest/callback` (CORRECT!)

---

### Step 3: Get Your Credentials

In your Pinterest App dashboard, you'll see:

1. **App ID** (looks like: `1234567890`)
   - This is your `PINTEREST_CLIENT_ID`
   - Copy this value

2. **App secret** (looks like: `abcdef123456789...`)
   - This is your `PINTEREST_CLIENT_SECRET`
   - Copy this value
   - **Keep this secret!** Never commit to git

---

### Step 4: Update .env File

1. **Open** `.env` file in your project root

2. **Find these lines**:
   ```bash
   PINTEREST_CLIENT_ID="YOUR_PINTEREST_APP_ID_HERE"
   PINTEREST_CLIENT_SECRET="YOUR_PINTEREST_APP_SECRET_HERE"
   ```

3. **Replace** with your actual credentials:
   ```bash
   PINTEREST_CLIENT_ID="1234567890"  # Your actual App ID
   PINTEREST_CLIENT_SECRET="abcdef123456..."  # Your actual App secret
   ```

4. **Save** the file

---

### Step 5: Restart Your Server

```bash
# In your terminal, stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Important**: You MUST restart the server for environment variables to reload!

---

### Step 6: Verify Setup

Run the verification script:

```bash
node verify-pinterest-setup.js
```

**Expected output**:
```
✅ PINTEREST_CLIENT_ID: 1234567890
✅ PINTEREST_CLIENT_SECRET: abcdef123...
✅ NEXT_PUBLIC_APP_URL: http://localhost:3000
```

If you see ✅ for all three, you're ready!

---

### Step 7: Test the Integration

1. **Navigate to**: http://localhost:3000/settings

2. **Click "Connect"** on the Pinterest card

3. **Expected behavior**:
   - Redirects to Pinterest (pinterest.com/oauth)
   - Shows authorization screen
   - Lists permissions requested

4. **Click "Allow access"**

5. **Expected redirect**:
   - Returns to http://localhost:3000/settings
   - Shows green success notification
   - Pinterest card shows your username
   - "Sync" button is now available

---

## Troubleshooting

### Error: "oauth_init_failed"

**Cause**: Pinterest credentials not configured

**Solution**:
1. Run `node verify-pinterest-setup.js`
2. Follow steps above to configure credentials
3. Restart server

---

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI in Pinterest app doesn't match your app

**Solution**:
1. Go to Pinterest Developer Console → Your App → Settings
2. Check "Redirect URIs" section
3. Must be EXACTLY: `http://localhost:3000/api/auth/pinterest/callback`
4. Save settings
5. Try connecting again

---

### Error: "invalid_client"

**Cause**: Client ID or Secret is incorrect

**Solution**:
1. Go to Pinterest Developer Console
2. Copy App ID and App secret again
3. Update .env file
4. Restart server

---

### Error: "access_denied"

**Cause**: User clicked "Deny" on Pinterest authorization screen

**Solution**:
- This is normal if user denies access
- Try connecting again and click "Allow access"

---

## Production Deployment

When deploying to production:

1. **Update redirect URI** in Pinterest app:
   ```
   https://yourdomain.com/api/auth/pinterest/callback
   ```

2. **Add to production .env**:
   ```bash
   PINTEREST_CLIENT_ID=your_app_id
   PINTEREST_CLIENT_SECRET=your_app_secret
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Keep credentials secure**:
   - Never commit .env to git
   - Use environment variables in hosting platform
   - Rotate secrets periodically

---

## Support

If you're still having issues:

1. **Check server logs** in your terminal
2. **Run verification script**: `node verify-pinterest-setup.js`
3. **Check Pinterest app settings** at https://developers.pinterest.com/apps/
4. **Verify redirect URI** matches exactly

---

## What Happens Next?

Once configured:

1. ✅ Users can connect their Pinterest accounts
2. ✅ Click "Sync" to import pins
3. ✅ Pins appear in Today feed with Pinterest icons
4. ✅ AI processes each pin for summaries
5. ✅ XP and badges earned for imported content

---

**Need help?** Check the build log at `docs/pinterest-build-log.md` for technical details.
