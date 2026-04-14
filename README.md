# Fun2Learn 

A gamified e-learning platform built as a Final Year Project. Fun2Learn brings Duolingo-style engagement mechanics to online education — tutors create structured courses, students progress through interactive lesson roadmaps, and a full gamification layer keeps learners motivated.

**Try Now:** https://main.d2826nkxpr52kp.amplifyapp.com/

---

## Features

### For Students
- **Lesson Roadmaps** — Visual progress paths through course content
- **Streaks** — Daily login/activity streaks to build consistency
- **XP & Gems** — Earn experience points and gems for completing lessons
- **Daily Quests** — Three rotating daily challenges with gem rewards
- **Achievements** — Unlock badges for hitting learning milestones
- **Leaderboards** — Weekly ranked leaderboards with promotion/relegation
- **Course Enrollment** — Browse and enroll in free or paid courses
- **Social Profiles** — Follow other learners and tutors, view public profiles

### For Tutors
- **Course Creation** — Build courses with structured lessons and attachments
- **Monetization** — Set gem prices for courses; earn 90% of enrollment revenue
- **Redeem System** — Convert earned gems to real currency (1 gem = 0.8 Rs)
- **Analytics** — Track unique students, average ratings, and course stats

### For Admins
- **Dashboard** — Platform-wide stats (users, courses, enrollments)
- **Redeem Management** — Approve or reject tutor withdrawal requests

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python), SQLAlchemy ORM |
| Database | PostgreSQL |
| Storage | AWS S3 |
| Auth | JWT (HS256) |
| Scheduling | APScheduler (leaderboard resets every Sunday midnight) |

---

## Project Structure

```
fun2learn/
├── fun2learn_frontend/      # Next.js frontend
│   └── src/
│       ├── app/             # Page routes (Next.js App Router)
│       ├── components/      # Reusable UI components
│       ├── api/             # API client functions
│       └── models/          # TypeScript types and response models
│
└── fun2learn_backend/       # FastAPI backend
    └── app/
        ├── routes/          # API route handlers
        ├── models/          # SQLAlchemy DB models + Pydantic schemas
        ├── utils/           # Helpers (leaderboard, S3, logging, etc.)
        ├── connection/      # DB + S3 connection setup
        └── scripts/         # Seed scripts (achievements, tags)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL
- AWS S3 bucket (for file storage)

### Backend

```bash
cd fun2learn_backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# .\venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.sample .env
# Fill in your DB credentials, JWT secret, AWS keys, etc.

# Run the server
uvicorn app.main:app --reload
```

API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend

```bash
cd fun2learn_frontend

# Install dependencies
npm install

# Configure environment
cp .env.sample .env
# Set NEXT_PUBLIC_API_URL to your backend URL

# Run the dev server
npm run dev
```

App available at `http://localhost:3000`

---

## Gamification Design

| Feature | Details |
|---|---|
| Streaks | Tracked daily; streak modal shown after each lesson |
| Gems | Earned via daily quests; spent on paid course enrollment |
| Daily Quests | 3 quests reset daily: Flame Keeper (15 gems), On a Roll (20 gems), Knowledge Seeker (30 gems) |
| Leaderboards | 8 ranks — Bronze → Silver → Gold → Platinum → Ruby → Pearl → Diamond → Champions |
| Leaderboard Reset | Every Sunday midnight; top 3 promoted, bottom 2 relegated (if ≥5 members) |
| Achievements | Milestone-based badges seeded via `seed_achievements.py` |

---

## Key API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/auth/login` | Login and receive JWT |
| POST | `/auth/signup` | Register new user |
| GET | `/student/daily-quests` | Fetch today's quest progress |
| GET | `/student/leaderboard` | Get weekly leaderboard |
| GET | `/student/streak` | Get streak + gem balance |
| POST | `/course/enroll` | Enroll in a course |
| POST | `/tutor/redeem` | Submit a gem withdrawal request |
| GET | `/admin/redeem-requests` | View all pending redeem requests |
| GET | `/user/profile/{user_id}` | Public user profile |

---

## Database Notes

When adding new tables, uncomment `ensure_create_all()` in `main.py` before running the server. Required migrations for recent features:

```sql
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_gems INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
```

---

## License

This project was developed as a Final Year Project at Islington College, affiliated with London Metropolitan University.
