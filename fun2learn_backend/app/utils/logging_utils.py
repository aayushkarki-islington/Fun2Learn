import logging
import sys

LOG_LEVEL = logging.INFO

LOG_FORMAT = (
    "%(levelname)s: | "
    "%(filename)s:%(lineno)d | %(message)s"
)

def setup_logging():
    logging.basicConfig(
        level=LOG_LEVEL,
        format=LOG_FORMAT,
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Optional: tune noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)