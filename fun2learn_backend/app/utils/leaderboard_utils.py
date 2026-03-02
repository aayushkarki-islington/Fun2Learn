from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)

RANKS = ["bronze", "silver", "gold", "platinum", "ruby", "pearl", "diamond", "champions"]
LEADERBOARD_MAX_SIZE = 12
PROMOTION_COUNT = 3
RELEGATION_COUNT = 2


def get_current_week_bounds() -> tuple[datetime, datetime]:
    """Returns (week_start, week_end) for the current Sunday-to-Sunday week (local time)."""
    now = datetime.now()
    days_since_sunday = (now.weekday() + 1) % 7  # Mon=1, Tue=2, ..., Sat=6, Sun=0
    week_start = (now - timedelta(days=days_since_sunday)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


def process_leaderboard_resets(db: Session) -> None:
    """Close all expired open leaderboards and update user ranks accordingly."""
    from app.models.db_models import Leaderboard, UserInventory

    now = datetime.now()
    expired = db.execute(
        select(Leaderboard).where(
            Leaderboard.status == "open",
            Leaderboard.week_end <= now
        )
    ).scalars().all()

    for lb in expired:
        entries = sorted(lb.entries, key=lambda e: e.xp_earned, reverse=True)
        n = len(entries)

        for i, entry in enumerate(entries):
            inventory = db.execute(
                select(UserInventory).where(UserInventory.user_id == entry.user_id)
            ).scalar_one_or_none()
            if not inventory:
                continue

            current_rank = inventory.current_rank if inventory.current_rank in RANKS else RANKS[0]
            current_idx = RANKS.index(current_rank)

            if i < PROMOTION_COUNT:
                # Top 3 → promote (champions stay at top)
                inventory.current_rank = RANKS[min(current_idx + 1, len(RANKS) - 1)]
            elif n >= (PROMOTION_COUNT + RELEGATION_COUNT) and i >= n - RELEGATION_COUNT:
                # Bottom 2 → relegate (only if enough members, bronze stays at bottom)
                inventory.current_rank = RANKS[max(current_idx - 1, 0)]

        lb.status = "closed"
        logger.info(f"Processed leaderboard {lb.id}: rank={lb.rank}, entries={n}")

    if expired:
        db.commit()
        logger.info(f"Closed {len(expired)} expired leaderboards")
