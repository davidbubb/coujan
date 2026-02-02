# CalmPhrases Prototype

Run locally:

1. Install dependencies
   npm install

2. Start dev server
   npm run dev

3. Open http://localhost:5173 (or the URL shown by Vite)

Notes:
- TTS uses your browser's Web Speech API. Cantonese voice availability varies by browser/OS — if none available, the browser may fallback to a Mandarin voice.
- Preferences and favorites are stored in localStorage.
- This prototype is purposely minimal and mobile-first.
- Ambient animated gradient background added (CSS). Animations are subtle and slow; the app respects `prefers-reduced-motion` and will reduce or disable animations for users who choose that setting.
- Note: `vite.config.js` uses a dynamic `await import('@sveltejs/vite-plugin-svelte')` because that plugin is ESM-only. Loading it dynamically avoids the "package is ESM only but it was tried to load by `require`" error when Node attempts to load the Vite config.

Next steps:
- Add a Service Worker to cache last phrase and assets (for offline)
- Improve voice selection and add fallback pre-generated audio files for consistent Cantonese TTS
- Add a small settings modal and favorites view
- Accessibility audit and keyboard focus states
- Small animations (breathing/gradient) with reduced-motion all set