# USA Attractions v7

Version 7 is the launch-readiness build.

## Added in v7
- Traveler photo uploads using Supabase Storage
- Traveler photo gallery on attraction details
- Collaborative-trip database model
- Share/collaboration control
- Native local-notification scheduling through Capacitor
- Offline attraction cache fallback
- Basic service worker + web app manifest
- Offline status mode
- Public shared-trip route scaffold
- Continued iPhone/Android Capacitor support
- All v6 features retained

## What is fully wired
With Supabase configured:
- accounts
- favorites / visited / bucket list sync
- multiple trips and stops
- reviews
- photo upload metadata
- Storage upload code (requires the `attraction-photos` bucket)
- trip share-token creation
- reminder records

With Capacitor installed on a device:
- local notification permission and scheduling code

## Production setup still required
1. Create the `attraction-photos` Supabase Storage bucket and its storage policies.
2. Configure native iOS/Android signing, icons, splash screens and privacy strings.
3. The public shared-trip page needs a server-side/read-only data fetch before exposing trip contents.
4. Email collaborator invitations need a trusted backend/email provider.
5. True remote push notifications require APNs/FCM or a push provider.
6. Review/photo moderation should be added before public launch.

## Run
Copy `.env.example` to `.env.local`, configure desired services, then:

    npm install
    npm run dev

## Mobile
See `mobile/README.md` and `capacitor.config.ts`.
