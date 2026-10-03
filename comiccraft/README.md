# ComicCraft Studio

ComicCraft is a local-first classic anime comic creator. It follows the product flow in the supplied project brief: collect a prompt and creative direction, build a five-panel outline, add narration and dialogue, preview the issue, save it to the browser archive, and export PNG or PDF.

## Run locally

```powershell
cd comiccraft\client
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Build for deployment with `npm run build`, then upload `client/dist` to a static host such as Netlify, GitHub Pages, or Vercel.

## What works now

- Prompt, character, setting, tone, and art-style controls.
- Five-panel local story generation from the bundled story library.
- Editable panel titles, narration, captions, and dialogue.
- Image prompt references for every generated panel.
- Browser archive using localStorage.
- PNG and PDF downloads from the inked preview.
- Dedicated PDF export success screen with a return-to-studio action.
- Optional public JSON story feeds with graceful fallback to the bundled data.

## Story source

The default data is `client/public/stories.json`. Add stories using this shape:

```json
[{ "emotion": "Happy", "title": "A title", "summary": "A summary", "characters": [{"name": "Hero", "role": "lead"}], "panels": [{"scene": "A scene", "dialogue": [{"speaker": "Hero", "text": "A line"}]}] }]
```

The PDF brief describes a future server-backed Gemini and Stable Diffusion pipeline. This repository intentionally keeps the working demo keyless and browser-safe; production Gemini/image-model calls should be added behind a server endpoint so API keys are not exposed in the client.
