# Extension Testing Checklist

Before submitting to Chrome Web Store, verify all functionality works correctly.

## Installation & Setup

- [ ] Extension loads without errors in chrome://extensions
- [ ] No console errors on installation
- [ ] Icons display correctly in toolbar
- [ ] Extension description shows correctly

## Authentication Flow

- [ ] Login button opens new tab (not popup window)
- [ ] Can authenticate with Clerk successfully
- [ ] Success screen displays with email
- [ ] Token is stored securely
- [ ] Auth tab closes after 3 seconds
- [ ] Extension popup shows SaveScreen after login
- [ ] Logout button works correctly
- [ ] Token persists across browser restarts

## Save Functionality - Popup

- [ ] Current tab URL is detected automatically
- [ ] Current tab title displays correctly
- [ ] Platform badge shows (Twitter, Reddit, etc.)
- [ ] Can add a note (up to 500 characters)
- [ ] Character count updates correctly
- [ ] Save button works
- [ ] Success screen displays after save
- [ ] Badges display if earned
- [ ] "Save Another" button returns to SaveScreen
- [ ] "View in Tavlo" opens tavlo.ca/today

## Save Functionality - Context Menu

- [ ] Right-click menu shows "Save to Tavlo"
- [ ] Works on links
- [ ] Works on pages
- [ ] Shows saving notification
- [ ] Shows success notification with badge count
- [ ] Shows error notification if fails
- [ ] Works when not logged in (shows login prompt)

## URL Detection - Twitter/X

- [ ] Detects tweet URL when viewing in modal
- [ ] Detects tweet URL when on /home feed
- [ ] Uses canonical URL meta tag
- [ ] Uses og:url as fallback
- [ ] Warns if saving generic /home URL

## URL Detection - LinkedIn

- [ ] Extracts post URL from feed
- [ ] Uses canonical URL
- [ ] Uses og:url
- [ ] Searches DOM for URN
- [ ] Constructs URL from activity ID
- [ ] Warns if saving generic /feed URL

## URL Detection - TikTok

- [ ] Extracts video URL from For You page
- [ ] Uses canonical URL
- [ ] Uses og:url
- [ ] Finds active video container
- [ ] Constructs URL from username + video ID
- [ ] Searches visible links first

## URL Detection - Other Platforms

- [ ] YouTube videos work
- [ ] Reddit posts work
- [ ] Instagram posts work
- [ ] Generic websites work
- [ ] Platform badge displays correctly

## URL Editing

- [ ] Can click "Edit URL" button
- [ ] URL input pre-fills with current URL
- [ ] Can paste new URL
- [ ] URL validation works (rejects invalid URLs)
- [ ] "Save URL" updates displayed URL
- [ ] "Cancel" reverts changes
- [ ] Feed warning updates after edit

## Error Handling

- [ ] Invalid URL shows error message
- [ ] Network errors show helpful message
- [ ] 401 errors prompt re-login
- [ ] 429 rate limit shows appropriate message
- [ ] Empty URL shows error
- [ ] Popup blocker error shows helpful message

## Performance

- [ ] Popup opens quickly (< 500ms)
- [ ] URL detection completes quickly
- [ ] Save operation feels snappy (optimistic UI)
- [ ] No memory leaks
- [ ] Background worker doesn't crash

## Security

- [ ] Token stored in sync storage (not local)
- [ ] API requests use HTTPS only
- [ ] Bearer token included in headers
- [ ] No sensitive data in console logs (check)
- [ ] Content Security Policy enforced
- [ ] External messages only from tavlo.ca

## Permissions

- [ ] activeTab only when popup opens
- [ ] storage for token only
- [ ] scripting only for URL extraction
- [ ] notifications only for save feedback
- [ ] contextMenus for right-click
- [ ] No unnecessary permissions requested

## Cross-Browser

- [ ] Works in Chrome
- [ ] Works in Edge (Chromium)
- [ ] Works in Brave
- [ ] Works in other Chromium browsers

## Edge Cases

- [ ] Works on chrome:// pages (shows appropriate error)
- [ ] Works on extension:// pages (shows appropriate error)
- [ ] Works on file:// URLs
- [ ] Works with very long URLs (> 2000 chars)
- [ ] Works with URLs containing special characters
- [ ] Works when offline (shows network error)
- [ ] Works with slow network (optimistic UI)

## Visual Polish

- [ ] All animations smooth
- [ ] Hover states work
- [ ] Focus states visible
- [ ] Colors match brand
- [ ] Typography consistent
- [ ] Icons sharp at all sizes
- [ ] No layout shifts
- [ ] Responsive to popup size

## Accessibility

- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Focus visible
- [ ] Buttons have clear labels
- [ ] Error messages clear
- [ ] Color contrast sufficient

## Documentation

- [ ] README is clear and complete
- [ ] Privacy policy accurate
- [ ] Chrome Web Store guide ready
- [ ] Testing checklist complete

## Final Checks

- [ ] Version number incremented
- [ ] No debug code left in
- [ ] No console.logs (except debugging)
- [ ] All TODOs resolved
- [ ] Build completes without errors
- [ ] TypeScript errors resolved
- [ ] Linting passes
- [ ] File size reasonable (< 5MB)
- [ ] Icons optimized
- [ ] Manifest valid

## Before Submission

- [ ] Test on fresh Chrome profile
- [ ] Test full flow from installation
- [ ] Create ZIP from dist folder
- [ ] Verify ZIP contents correct
- [ ] Screenshots prepared (3-5)
- [ ] Store listing text ready
- [ ] Privacy practices declared

---

## Notes

Use this space to track any issues found during testing:

```
Issue: [Description]
Status: [Fixed/In Progress/Blocked]
Fix: [What was done to fix it]
```
