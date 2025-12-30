# Privacy Policy for Tavlo Extension

Last Updated: December 30, 2024

## Overview

The Tavlo Chrome Extension ("the Extension") is designed to help you save links to your personal Tavlo account with one click. We take your privacy seriously and are committed to protecting your personal information.

## Information We Collect

### Authentication Token

- We store your Tavlo authentication token securely using Chrome's sync storage
- This token is used to authenticate your requests to the Tavlo API
- The token is never shared with third parties

### URLs and Notes

- When you save a link, we send the URL and any optional notes you provide to the Tavlo API
- This data is stored in your personal Tavlo account and subject to Tavlo's privacy policy at https://tavlo.ca/privacy

### Tab Information

- The extension accesses the current tab's URL and title to pre-populate the save form
- This information is never collected or stored by the extension itself
- It is only sent to the Tavlo API when you explicitly click "Save"

## How We Use Your Information

- **Authentication**: Your token is used to authenticate API requests to your Tavlo account
- **Saving Links**: URLs and notes are sent to Tavlo's servers only when you click "Save"
- **Platform Detection**: We detect which platform you're on (Twitter, LinkedIn, etc.) to provide better context

## Data Storage

- **Local Storage**: Your authentication token is stored locally in Chrome's sync storage
- **No Analytics**: We do not collect any analytics or usage data
- **No Tracking**: We do not track your browsing history or behavior

## Permissions Explanation

The extension requires the following permissions:

- **activeTab**: To read the URL and title of the current tab when you open the extension
- **storage**: To securely store your authentication token
- **contextMenus**: To add a "Save to Tavlo" option to the right-click menu
- **notifications**: To show success/error notifications when saving links
- **scripting**: To extract the correct URL from single-page applications (Twitter, LinkedIn, TikTok)
- **host_permissions (https://tavlo.ca/\*)**: To communicate with the Tavlo API

## Third-Party Access

- We only send data to Tavlo's servers (https://tavlo.ca)
- We do not share your information with any other third parties
- We do not sell your data

## Security

- All communication with Tavlo's API uses HTTPS encryption
- Your authentication token is stored securely using Chrome's built-in storage API
- We use Bearer token authentication for all API requests

## Your Rights

You have the right to:

- Revoke the extension's access at any time by logging out or uninstalling
- Request deletion of your data through your Tavlo account settings
- Review our code (the extension is open source)

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be posted in the extension's listing and in this document.

## Contact

If you have any questions about this privacy policy or the extension's data practices, please contact us at support@tavlo.ca.

## Compliance

This extension complies with:

- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
