# Alceo frontend

React + Vite frontend (Home, Workout, Progress, Filters, Profile, active workout session).

```
npm install
npm run dev     # local dev server
npm run build   # production build
```

All data is placeholder/local: settings, plans and history persist in `localStorage` (keys prefixed `alceo:`).
The "AI" plan generator (`src/data/generator.js`) is a local rules-based stand-in to be replaced by a backend call.
