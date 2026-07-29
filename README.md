# MiniChat

MiniChat is a responsive, real-time messaging MVP with contact management. The implementation mirrors the component names and design tokens in the accompanying Figma file.

## Features

- Demo identity selection using per-tab sessions
- Responsive mobile and desktop layouts
- Contact search and add flow
- One-to-one text conversations
- Real-time delivery and read state with Socket.IO
- Light and dark themes
- Local JSON persistence for zero-configuration testing

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). To test real-time messaging, open two tabs and choose a different demo profile in each tab.

Production build:

```bash
npm run build
npm start
```

## Project structure

- `src/components/` contains React components matching the Figma library names.
- `src/App.css` contains the Figma-aligned primitive and semantic CSS variables.
- `server/index.mjs` provides the REST API, persistence, and Socket.IO transport.
- `server/data.json` is the local demo data store.

## Design and delivery

- [Figma design system and product screens](https://www.figma.com/design/GRKUN0QH8AJRlrytVxqsvN/Untitled)
- Figma component names map one-to-one to the files in `src/components/`.
- CSS variable names match the Figma WEB code syntax, for example `color/bg/accent` maps to `var(--color-bg-accent)`.

For Supernova, import the Figma file as the design-system source, connect this repository as the delivery target, and set generated output to a dedicated directory such as `supernova/` so generated files do not overwrite the application source.
