# Resend Email Newsletter Setup Guide

## Your Personalized Email Address
**`save+cmibd00vi000012mwuqlha0so@resend.dev`**

Forward any newsletter to this address and it will automatically be saved to ContentHub with AI summaries!

---

## Quick Setup (15 Minutes)

### Step 1: Start ngrok (Webhook Tunnel to Localhost)

Open a **new terminal window** and run:

```bash
ngrok http 3000
```

You'll see output like this:
```
Session Status    online
Forwarding        https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`) - you'll need it in Step 3.

> ⚠️ **Keep this terminal open!** If you close it, the tunnel stops working.

---

### Step 2: Configure Resend Webhook

1. **Go to Resend Dashboard:**
   https://resend.com/webhooks

2. **Click "Create Webhook"**

3. **Fill in the form:**
   - **Endpoint URL:** `https://abc123.ngrok.io/api/webhooks/email`
     _(Replace `abc123.ngrok.io` with YOUR ngrok URL from Step 1)_

   - **Events to listen for:**
     ✅ Check **"email.received"**
     _(Uncheck all others)_

4. **Click "Create Webhook"**

5. **Copy the Signing Secret:**
   You'll see something like: `whsec_abc123def456...`
   Copy this entire string.

---

### Step 3: Add Webhook Secret to .env

1. **Open your `.env` file**

2. **Add these lines at the end:**

```bash
# Resend Inbound Email (Newsletter Import)
RESEND_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"
RESEND_INBOUND_DOMAIN="resend.dev"
```

3. **Replace `whsec_YOUR_SECRET_HERE`** with the secret you copied in Step 2

4. **Save the file**

---

### Step 4: Restart Your Dev Server

In your terminal where Next.js is running, press:
- **Ctrl+C** to stop
- **`npm run dev`** to restart

The server needs to restart to load the new environment variables.

---

### Step 5: Configure Inbound Email in Resend

1. **Go to Resend Inbound Settings:**
   https://resend.com/inbound

2. **Add Inbound Address:**
   - Click "Add Inbound Address" or "Configure"
   - **Address pattern:** `save+*@resend.dev`
     _(The `*` wildcard allows any user ID)_

3. **Save**

---

### Step 6: Test with a Real Newsletter! 🎉

1. **Open any email newsletter** you receive (Morning Brew, Substack, etc.)

2. **Forward it** to your personalized address:
   `save+cmibd00vi000012mwuqlha0so@resend.dev`

3. **Wait 5-30 seconds**

4. **Check ContentHub:**
   Open http://localhost:3000/today

5. **You should see:**
   - ✅ Newsletter with AI-generated title
   - ✅ 3-bullet summary of key points
   - ✅ Relevant tags
   - ✅ Category (tech, business, etc.)
   - ✅ XP awarded!

---

## Troubleshooting

### "Webhook verification failed"
- Make sure `RESEND_WEBHOOK_SECRET` in `.env` matches the secret from Resend dashboard
- Restart your dev server after adding the secret

### "No email received"
- Check ngrok is still running (`https://abc123.ngrok.io` should be accessible)
- Verify webhook URL in Resend ends with `/api/webhooks/email`
- Check Resend webhook logs: https://resend.com/webhooks → Click your webhook → "Recent Deliveries"

### "Email received but not showing in ContentHub"
- Check terminal logs for errors
- Run: `npx tsx scripts/check-email-item.ts` to see if item was created
- The email might have been categorized - check different views in ContentHub

---

## For Production Deployment

When you're ready to deploy:

1. **Deploy ContentHub** to Vercel/Railway/Render

2. **Add environment variable** in production:
   ```
   RESEND_WEBHOOK_SECRET=whsec_your_secret_here
   RESEND_INBOUND_DOMAIN=resend.dev
   ```

3. **Update Resend webhook URL** to production:
   ```
   https://your-production-domain.com/api/webhooks/email
   ```

4. **Keep using the same email address:**
   `save+cmibd00vi000012mwuqlha0so@resend.dev`

---

## Custom Domain (Optional)

Want to use `save@contenthub.com` instead of `@resend.dev`?

1. **Add domain in Resend:**
   https://resend.com/domains → Add Domain

2. **Update DNS records** (Resend will show you which records to add)

3. **Change `.env`:**
   ```
   RESEND_INBOUND_DOMAIN="contenthub.com"
   ```

4. **New email address becomes:**
   `save+cmibd00vi000012mwuqlha0so@contenthub.com`

---

## Quick Reference Commands

```bash
# Check if dev server is running
ps aux | grep "npm run dev"

# Restart dev server
# Press Ctrl+C, then:
npm run dev

# Test email processing locally
npx tsx scripts/test-email-webhook.ts

# Check if emails were received
npx tsx scripts/check-email-item.ts

# Get your email address
npx tsx scripts/get-user-email.ts
```

---

## Need Help?

- **Resend Docs:** https://resend.com/docs/api-reference/emails/webhooks
- **ngrok Docs:** https://ngrok.com/docs
- **Check logs** in your terminal for error messages
