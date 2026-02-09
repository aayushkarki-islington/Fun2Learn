"""
Seed script to populate the tags table with predefined tags.

Usage:
    cd fun2learn_backend
    python -m app.scripts.seed_tags
"""

from dotenv import load_dotenv
load_dotenv()

import uuid
from sqlalchemy import text
from app.connection.postgres_connection import SessionLocal
from app.models.db_models import Tag

TAGS = [
    # ── Academic Subjects ──
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "History",
    "Geography",
    "Literature",
    "Philosophy",
    "Psychology",
    "Sociology",
    "Economics",
    "Political Science",
    "Astronomy",
    "Environmental Science",
    "Statistics",
    "Engineering",
    "Architecture",
    "Law",
    "Medicine",

    # ── Programming & Tech ──
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "C++",
    "C#",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "HTML & CSS",
    "SQL",
    "R",
    "PHP",
    "Ruby",
    "Web Development",
    "Mobile Development",
    "Game Development",
    "Data Science",
    "Machine Learning",
    "Artificial Intelligence",
    "Deep Learning",
    "Cloud Computing",
    "DevOps",
    "Cybersecurity",
    "Blockchain",
    "Databases",
    "API Development",
    "Frontend",
    "Backend",
    "Full Stack",
    "Algorithms",
    "Data Structures",
    "Operating Systems",
    "Networking",
    "Software Engineering",

    # ── Mathematics Topics ──
    "Algebra",
    "Calculus",
    "Geometry",
    "Trigonometry",
    "Linear Algebra",
    "Probability",
    "Discrete Mathematics",
    "Number Theory",

    # ── Science Topics ──
    "Organic Chemistry",
    "Mechanics",
    "Thermodynamics",
    "Electromagnetism",
    "Quantum Physics",
    "Genetics",
    "Ecology",
    "Microbiology",
    "Anatomy",
    "Neuroscience",

    # ── Languages ──
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Portuguese",
    "Italian",
    "Sign Language",

    # ── Business & Finance ──
    "Accounting",
    "Marketing",
    "Entrepreneurship",
    "Finance",
    "Management",
    "Business Strategy",
    "Stock Market",
    "Cryptocurrency",
    "Personal Finance",
    "Project Management",
    "Leadership",
    "Negotiation",

    # ── Creative & Arts ──
    "Graphic Design",
    "UI/UX Design",
    "Photography",
    "Music Theory",
    "Film Making",
    "Animation",
    "Drawing",
    "Painting",
    "Creative Writing",
    "Journalism",
    "Public Speaking",
    "3D Modeling",

    # ── Health & Wellness ──
    "Nutrition",
    "Fitness",
    "Mental Health",
    "Yoga",
    "First Aid",
    "Sports Science",

    # ── Exam Prep ──
    "SAT Prep",
    "GRE Prep",
    "IELTS",
    "TOEFL",
    "AP Courses",
    "O/L Prep",
    "A/L Prep",
    "Competitive Programming",

    # ── General / Skill-Based ──
    "Critical Thinking",
    "Problem Solving",
    "Research Methods",
    "Study Skills",
    "Time Management",
    "Communication",
    "Teamwork",
    "Ethics",
    "Logical Reasoning",
    "Speed Reading",

    # ── Difficulty / Audience ──
    "Beginner Friendly",
    "Intermediate",
    "Advanced",
    "Kids",
    "High School",
    "University",
    "Professional",

    # ── Format ──
    "Quiz Based",
    "Hands-On",
    "Theory",
    "Practice Problems",
    "Project Based",
    "Interactive",
    "Crash Course",
    "Certification Prep",
]


def seed_tags():
    db = SessionLocal()
    try:
        existing = {row[0] for row in db.query(Tag.name).all()}

        new_tags = []
        for name in TAGS:
            if name not in existing:
                new_tags.append(Tag(id=str(uuid.uuid4()), name=name))

        if not new_tags:
            print(f"All {len(TAGS)} tags already exist. Nothing to insert.")
            return

        db.add_all(new_tags)
        db.commit()
        print(f"Inserted {len(new_tags)} new tags ({len(existing)} already existed).")

    except Exception as e:
        db.rollback()
        print(f"Error seeding tags: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_tags()
