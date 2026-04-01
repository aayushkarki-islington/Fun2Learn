from datetime import datetime, timezone, date
from typing import Optional


def monthly_periods(start: datetime, end: datetime) -> list[str]:
    """Generate all YYYY-MM period labels between start and end inclusive."""
    periods = []
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        periods.append(f"{y}-{m:02d}")
        m += 1
        if m > 12:
            m = 1
            y += 1
    return periods


def parse_date_bounds(
    start_date: Optional[date], end_date: Optional[date]
) -> tuple[datetime, datetime]:
    """Return timezone-aware datetime bounds. Defaults to last 6 months."""
    now = datetime.now(timezone.utc)

    if end_date:
        end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, tzinfo=timezone.utc)
    else:
        end_dt = now

    if start_date:
        start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc)
    else:
        # Default: 6 months back from end
        month = end_dt.month - 5
        year = end_dt.year
        if month <= 0:
            month += 12
            year -= 1
        start_dt = end_dt.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)

    return start_dt, end_dt
