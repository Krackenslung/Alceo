from flask import Flask, jsonify

from app.routes import ai, auth, exercises, filters, users, workouts


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth.bp, url_prefix="/api/auth")
    app.register_blueprint(users.bp, url_prefix="/api/users")
    app.register_blueprint(filters.bp, url_prefix="/api/filters")
    app.register_blueprint(exercises.bp, url_prefix="/api/exercises")
    app.register_blueprint(workouts.bp, url_prefix="/api/workouts")
    app.register_blueprint(ai.bp, url_prefix="/api/ai")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})
