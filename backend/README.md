# Alceo backend

Flask REST API for Alceo. See `CLAUDE.md` for rules and `alceo_1_1_schema.sql` for the schema.

## Setup (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # then fill in GEMINI_API_KEY, SECRET_KEY, DATABASE_URL, ...
```

## Database (Neon "Workout Log")

Pick one:

- **Empty database:** `alembic upgrade head`
- **Database already created by `alceo_1_1_schema.sql`:** `alembic stamp head`. This marks it as up to date without running anything.

The SQL file drops the old tables first, so don't run it on the main Neon branch without checking.

Then load the built-in exercises (the AI only picks from this catalog):

```powershell
flask --app app seed-exercises
```

## Run

```powershell
flask --app app run --debug     # http://localhost:5000
pytest                          # tests use a temporary SQLite file, no Neon or Gemini needed
```

## API (all JSON, prefix `/api`)

Auth uses `Authorization: Bearer <token>`. The token comes from register, login or google.

| Area | Endpoints |
|---|---|
| auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/google` (`id_token`), `GET /auth/me` |
| users | `GET/PATCH/DELETE /users/me`, `POST /users/me/complete-onboarding` |
| filters | `GET/POST /filters`, `GET/PATCH/DELETE /filters/<id>` (`?include_inactive=1`) |
| exercises | `GET/POST /exercises` (`?category=&equipment=&q=`), `GET/PATCH/DELETE /exercises/<id>` |
| workouts | `GET/POST /workouts` (`?status=`), `GET/PATCH/DELETE /workouts/<id>`, `POST /workouts/<id>/start\|finish\|abandon` |
| workout exercises | `POST /workouts/<id>/exercises`, `PATCH/DELETE /workouts/<id>/exercises/<we_id>`, `PUT /workouts/<id>/exercises/order` |
| sets | `POST /workouts/<id>/exercises/<we_id>/sets`, `PATCH/DELETE /workouts/<id>/sets/<set_id>` |
| ai | `POST /ai/workouts` (`{"request": "..."}`), `GET /ai/queries`, `GET /ai/queries/<id>` |

Errors always look like `{"error": {"code": "...", "message": "..."}}`.
