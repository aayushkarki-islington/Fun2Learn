"""
Seed script to populate the achievements table with predefined achievements.

Usage:
    cd fun2learn_backend
    python -m app.scripts.seed_achievements
"""

from dotenv import load_dotenv
load_dotenv()

import uuid
from app.connection.postgres_connection import SessionLocal
from app.models.db_models import Achievement

ACHIEVEMENTS = [
    # ── Lessons Completed ──────────────────────────────────
    {
        "name": "First Step",
        "description": "Complete your very first lesson.",
        "achievement_type": "lessons_completed",
        "goal": 1,
    },
    {
        "name": "Getting Started",
        "description": "Complete 5 lessons and build your momentum.",
        "achievement_type": "lessons_completed",
        "goal": 5,
    },
    {
        "name": "Lesson Rookie",
        "description": "Complete 10 lessons and prove your dedication.",
        "achievement_type": "lessons_completed",
        "goal": 10,
    },
    {
        "name": "Making Progress",
        "description": "Complete 25 lessons — you're on the right track!",
        "achievement_type": "lessons_completed",
        "goal": 25,
    },
    {
        "name": "Halfway to a Hundred",
        "description": "Complete 50 lessons and reach the halfway milestone.",
        "achievement_type": "lessons_completed",
        "goal": 50,
    },
    {
        "name": "Century Learner",
        "description": "Complete 100 lessons — a true learning milestone!",
        "achievement_type": "lessons_completed",
        "goal": 100,
    },
    {
        "name": "Lesson Legend",
        "description": "Complete 200 lessons and cement your legendary status.",
        "achievement_type": "lessons_completed",
        "goal": 200,
    },

    # ── Streak Days ─────────────────────────────────────────
    {
        "name": "Spark",
        "description": "Maintain a learning streak for 3 consecutive days.",
        "achievement_type": "streak_days",
        "goal": 3,
    },
    {
        "name": "On a Roll",
        "description": "Keep your streak alive for 7 days straight.",
        "achievement_type": "streak_days",
        "goal": 7,
    },
    {
        "name": "Two Weeks Strong",
        "description": "Maintain a 14-day streak — impressive consistency!",
        "achievement_type": "streak_days",
        "goal": 14,
    },
    {
        "name": "Monthly Grinder",
        "description": "Achieve a 30-day streak without missing a single day.",
        "achievement_type": "streak_days",
        "goal": 30,
    },
    {
        "name": "Iron Will",
        "description": "Sustain your streak for 60 days — you're unstoppable.",
        "achievement_type": "streak_days",
        "goal": 60,
    },
    {
        "name": "Streak Legend",
        "description": "Reach a 100-day streak — an extraordinary feat of dedication.",
        "achievement_type": "streak_days",
        "goal": 100,
    },

    # ── Courses Completed ───────────────────────────────────
    {
        "name": "Finisher",
        "description": "Complete your first course from start to finish.",
        "achievement_type": "courses_completed",
        "goal": 1,
    },
    {
        "name": "Dedicated",
        "description": "Complete 3 full courses.",
        "achievement_type": "courses_completed",
        "goal": 3,
    },
    {
        "name": "Champion",
        "description": "Complete 5 courses — you're a champion learner!",
        "achievement_type": "courses_completed",
        "goal": 5,
    },
    {
        "name": "Course Master",
        "description": "Complete 10 courses and master the art of learning.",
        "achievement_type": "courses_completed",
        "goal": 10,
    },

    # ── Courses Enrolled ────────────────────────────────────
    {
        "name": "Explorer",
        "description": "Enroll in your first course and start your journey.",
        "achievement_type": "courses_enrolled",
        "goal": 1,
    },
    {
        "name": "Knowledge Seeker",
        "description": "Enroll in 3 different courses.",
        "achievement_type": "courses_enrolled",
        "goal": 3,
    },
    {
        "name": "Scholar",
        "description": "Enroll in 10 courses — a true scholar of knowledge!",
        "achievement_type": "courses_enrolled",
        "goal": 10,
    },
]


def seed_achievements():
    db = SessionLocal()
    try:
        existing_names = {row[0] for row in db.query(Achievement.name).all()}

        new_achievements = []
        for data in ACHIEVEMENTS:
            if data["name"] not in existing_names:
                new_achievements.append(Achievement(
                    id=str(uuid.uuid4()),
                    name=data["name"],
                    description=data["description"],
                    achievement_type=data["achievement_type"],
                    goal=data["goal"],
                ))

        if not new_achievements:
            print(f"All {len(ACHIEVEMENTS)} achievements already exist. Nothing to insert.")
            return

        db.add_all(new_achievements)
        db.commit()
        print(f"Inserted {len(new_achievements)} new achievements ({len(existing_names)} already existed).")

    except Exception as e:
        db.rollback()
        print(f"Error seeding achievements: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_achievements()
