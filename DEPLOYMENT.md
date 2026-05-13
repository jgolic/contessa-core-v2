# Deployment

Contessa Core v2 is prepared for deployment as a normal online Next.js application.

## Required public environment variable

Set this in Vercel or in your local `.env.local` file:

```text
NEXT_PUBLIC_APP_URL=https://app.your-domain.com
```

Use a real public HTTPS URL that opens the deployed app on desktop, tablet, and phone browsers.

Do not use:

- `localhost`
- `127.0.0.1`
- `file://` URLs
- private LAN hostnames
- Windows file paths

## Optional public environment variables

```text
NEXT_PUBLIC_MAP_STYLE_URL=
NEXT_PUBLIC_MAPTILER_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If these values are missing, the app stays in graceful demo mode instead of crashing.

## Share behavior

The app uses the following order for public share links:

1. `NEXT_PUBLIC_APP_URL`
2. `window.location.origin` in the browser if the env var is not set

The app never intentionally shares:

- a local development hostname
- a Windows file path
- a `file://` URL

## Vercel checklist

1. Import the repository into Vercel.
2. Set `NEXT_PUBLIC_APP_URL` to the real production domain.
3. Add optional map and backend variables if needed.
4. Deploy with the default Next.js settings.
5. Open the deployed app and verify the `Share` flow uses the public HTTPS URL.

## Notes

- Map rendering is client-side only to avoid SSR crashes.
- Demo persistence currently uses browser storage for portability until a real backend is attached.
- Depth and planning visuals remain planning support only, not certified navigation.
