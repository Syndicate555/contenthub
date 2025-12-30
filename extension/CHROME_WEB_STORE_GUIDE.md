# Chrome Web Store Submission Guide

## Pre-Submission Checklist

### ✅ Code Quality
- [x] All TypeScript errors resolved
- [x] Code formatted with Prettier
- [x] No unused imports or functions
- [x] Production-ready (no localhost URLs)
- [x] Content Security Policy added
- [x] No console.logs in production code (except debugging paths)

### ✅ Required Files
- [x] manifest.json (Manifest V3)
- [x] Privacy Policy (PRIVACY.md)
- [x] README.md with clear documentation
- [x] High-quality icons (16x16, 48x48, 128x128)

### ✅ Security
- [x] Minimal permissions requested
- [x] Bearer token authentication
- [x] Secure token storage (Chrome sync storage)
- [x] HTTPS-only API communication
- [x] Content Security Policy configured

### ✅ Permissions Justification

The extension requires these permissions:

1. **activeTab**: Read current tab URL/title when user opens extension
2. **storage**: Store authentication token securely
3. **contextMenus**: Add "Save to Tavlo" to right-click menu
4. **notifications**: Show save success/error messages
5. **scripting**: Extract URLs from SPAs (Twitter, LinkedIn, TikTok)
6. **host_permissions (https://tavlo.ca/\*)**: API communication

## Chrome Web Store Requirements

### 1. Store Listing Assets

#### Screenshots (1280x800 or 640x400)
Prepare 3-5 screenshots showing:
1. Login screen
2. Save screen with URL detected
3. Success screen with badge
4. Context menu integration
5. Example saved content in Tavlo

#### Promotional Images
- Small tile: 440x280
- Large tile: 920x680 (optional)
- Marquee: 1400x560 (optional)

#### Icon
- ✅ Already created: 128x128 PNG with transparent background

### 2. Store Listing Content

**Name**: Tavlo - Save to Your Feed

**Summary** (132 chars max):
Save links with one click. Smart detection for Twitter, LinkedIn, TikTok. Organize your reading with gamification.

**Description**:
```
Save links to your personal Tavlo feed with one click!

✨ FEATURES
• One-click saving from popup or right-click menu
• Smart URL detection for social platforms
• Add notes to provide context
• Earn badges as you save
• Secure OAuth authentication

🎯 SMART PLATFORM DETECTION
Automatically extracts the correct URL from:
• Twitter/X - Works even in modals and feeds
• LinkedIn - Finds post URLs from your feed
• TikTok - Detects videos on For You page
• YouTube, Reddit, Instagram, and more

📝 ADD CONTEXT
Optionally add notes when saving to remember why you saved it

🏆 GAMIFICATION
Earn badges and track your reading habits

🔒 PRIVACY & SECURITY
• Only accesses tabs when you open the extension
• Secure token-based authentication
• No tracking or analytics
• Data encrypted in transit

Perfect for:
- Content curators
- Researchers
- Students
- Lifelong learners
- Anyone who saves interesting links

Start building your personal library today!
```

**Category**: Productivity

**Language**: English

### 3. Privacy Practices

In the Chrome Web Store dashboard, declare:

**Data Usage**:
- Website content: Used for saving links (user-initiated only)
- Authentication info: Stored locally for API access
- Usage stats: NOT collected

**Data Handling**:
- Not sold to third parties: YES
- Not used for unrelated purposes: YES
- Not used to determine creditworthiness: YES

### 4. Single Purpose

**Single Purpose Statement**:
"Save web links to your personal Tavlo feed for later reading and organization."

### 5. Testing Instructions for Reviewers

```
TESTING ACCOUNT:
(You'll need to provide test credentials or allow reviewer to create account)

TESTING STEPS:
1. Install extension
2. Click extension icon
3. Click "Login with Tavlo"
4. Authenticate (use test account above)
5. Navigate to any webpage
6. Click extension icon - URL should be detected
7. (Optional) Add a note
8. Click "Save to Tavlo"
9. Should see success screen
10. Right-click any link → "Save to Tavlo" should work

SPECIAL PLATFORMS TO TEST:
- Twitter: Open a tweet and save it
- LinkedIn: Open a post and save it
- TikTok: Open a video and save it
```

## Submission Steps

1. **Build Production Version**:
   ```bash
   npm run build
   ```

2. **Create ZIP**:
   ```bash
   cd dist
   zip -r tavlo-extension-v0.1.0.zip .
   ```

3. **Upload to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "New Item"
   - Upload ZIP file
   - Fill in store listing details
   - Add screenshots and promotional images
   - Submit for review

4. **After Approval**:
   - Update README with Chrome Web Store link
   - Announce launch
   - Monitor reviews and feedback

## Post-Launch

### Monitoring
- Check Chrome Web Store reviews daily
- Monitor error reports (if you add error reporting)
- Track user feedback

### Updates
- Increment version in manifest.json and package.json
- Create changelog
- Upload new ZIP to dashboard
- Submit for review

## Common Rejection Reasons to Avoid

✅ We've already addressed:
- Single purpose clearly defined
- Minimal permissions with justification
- Privacy policy included
- No external code (jQuery CDN, etc.)
- manifest.json follows MV3 standards
- Icons are high quality
- No misleading functionality

## Support

If rejected, respond to reviewers with:
- Detailed explanation of permission usage
- Screenshots showing functionality
- Reference to privacy policy
- Clarification of single purpose

Good luck with your submission! 🚀
