# Portfolio — Swastik Biswas

Personal portfolio site: a single-page, dark-themed React app with a mouse-tracked grid
background, animated intro, name-pronunciation audio, and vertical section navigation
(About / Experience / Projects / Contact).

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (dev server + build)
- [react-icons](https://react-icons.github.io/react-icons/) (Feather icon set)
- Plain CSS (no UI framework)

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
```

## Scripts

| Script                 | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start the Vite dev server with HMR         |
| `npm run build`        | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview`      | Preview the production build locally       |
| `npm run lint`         | Run ESLint                                 |
| `npm run lint:fix`     | Run ESLint and auto-fix                    |
| `npm run format`       | Format the codebase with Prettier          |
| `npm run format:check` | Check formatting without writing changes   |

## Project structure

```
public/            static assets (favicon, resume, pronunciation audio)
src/
  App.tsx          all components (sections, navigation, flags, audio button)
  App.css          component styles, animations, responsive breakpoints
  index.css        global styles and CSS variables (colors, focus ring)
  main.tsx         app entry point
index.html         document shell + SEO/social metadata
```
