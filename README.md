# Alceo frontend

React + Vite frontend: login/register, onboarding, Home, Workout editor, live session, Progress, Filters and Profile.
All data comes from the Flask API in `backend/`. See `backend/README.md` to set it up.

```
npm install
npm run dev     # http://localhost:5173, proxies /api to http://localhost:5000
npm run build   # production build
```

Start the backend first (`flask --app app run` inside `backend/`). The dev server forwards `/api` to it.
For a different API origin, set `ALCEO_API_ORIGIN` for the dev proxy, or `VITE_API_URL` to call the API directly.

How the UI maps to the backend:

- **Workouts** have no scheduled date. Planned and in-progress workouts show up as a list, and the week strip marks days you finished a workout.
- **AI** generates one workout per request (`POST /api/ai/workouts`), using your profile, active filters and recent sessions.
- **Filters** are `user_filters` rows. Equipment uses the backend's fixed vocabulary, and injuries replace "exercises to avoid".
- **Units:** the backend stores kg and cm only. The kg/lb toggle converts for display.
- Only the auth token, the units/week-start preferences and the profile photo are kept in `localStorage`.
