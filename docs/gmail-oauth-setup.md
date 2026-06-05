# Gmail OAuth2 Setup

Gmail requires OAuth2 (not a service account) for personal Gmail access. Do this once.

## 1. Create OAuth credentials in Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project (same one as your service account)
3. APIs & Services → Credentials → Create Credentials → OAuth client ID
4. Application type: **Desktop app**
5. Copy `Client ID` and `Client Secret`

## 2. Enable Gmail API

APIs & Services → Library → search "Gmail API" → Enable.

## 3. Get a refresh token (one-time)

Run this in terminal (replace placeholders):

```bash
CLIENT_ID="your-client-id.apps.googleusercontent.com"
CLIENT_SECRET="your-client-secret"

# Open this URL in a browser, log in as the betsy@... Gmail account, approve scopes
open "https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent"

# Paste the code from the browser redirect here:
CODE="4/xxxx..."

curl -X POST https://oauth2.googleapis.com/token \
  -d "code=${CODE}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=urn:ietf:wg:oauth:2.0:oob&grant_type=authorization_code"
```

Copy `refresh_token` from the JSON response.

## 4. Add to Vercel env vars

| Name | Value |
|---|---|
| `GMAIL_CLIENT_ID` | the client ID |
| `GMAIL_CLIENT_SECRET` | the client secret |
| `GMAIL_REFRESH_TOKEN` | the refresh token |

The refresh token does not expire unless you revoke access.
