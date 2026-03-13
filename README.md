# TOOLBOX

> 한국어 문서: [README.ko.md](README.ko.md)

Official website of **TOOLBOX**, a spatial design club at the Catholic University of Korea — built with React, Firebase, and Vite.

**Live:** https://toolbox-tau-eight.vercel.app/

## Features

- **Gallery** — project showcase with image/PDF support via Cloudinary
- **Schedule** — upcoming and past events
- **Study** — study log archive
- **Team** — member directory
- **Archive** — collective history and records
- **Admin** — content management panel (auth-protected)

## Tech Stack

- [React 18](https://react.dev/) + TypeScript
- [Vite](https://vitejs.dev/)
- [Firebase](https://firebase.google.com/) (Firestore)
- [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:3000`.

## Build

```bash
npm run build
```

Output goes to the `build/` directory.

## Environment Variables

Create a `.env.local` file with your Firebase config:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
