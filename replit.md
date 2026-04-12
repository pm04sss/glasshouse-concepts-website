# Glasshouse // Infrastructure & Engineering

Static landing page for Glasshouse Concepts — built with Vite + Tailwind CSS v4.

## Project Structure

```
index.html          ← Main page content (edit this for copy/structure changes)
src/
  style.css         ← Custom CSS: aurora blobs, glass panels, animations
  main.js           ← Entry point (imports style.css)
vite.config.js      ← Vite configuration
package.json        ← Dependencies and npm scripts
vercel.json         ← Vercel deployment settings
.gitignore          ← Files excluded from git
README.md           ← Setup and deployment guide
```

## Stack

- **Build tool**: Vite 6
- **CSS framework**: Tailwind CSS v4 (installed locally, not CDN)
- **Deployment**: Vercel (zero-config via vercel.json)

## Local Development

```bash
npm install
npm run dev       # → http://localhost:3000
```

## Production Build

```bash
npm run build     # outputs to dist/
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the GitHub repo in Vercel
3. Vercel auto-detects Vite and deploys — no config needed beyond `vercel.json`

## Making Changes

- **Content/structure**: edit `index.html`
- **Custom animations and styles**: edit `src/style.css`
- Tailwind utility classes work directly in `index.html`
