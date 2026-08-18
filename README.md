# Mobile packaging

This project includes Capacitor configuration so it can be wrapped for iPhone and Android.

Recommended production flow:

1. Build/export the web app.
2. Run `npm run cap:sync`.
3. Add native platforms with:
   - `npx cap add ios`
   - `npx cap add android`
4. Open the native projects:
   - `npm run cap:ios`
   - `npm run cap:android`

Before store submission, replace placeholder app identity/assets with production icons,
splash screens, privacy descriptions, signing credentials and store metadata.

Push notifications are not fully enabled yet. The database reminder model is included so
a notification service can deliver scheduled reminders later.
