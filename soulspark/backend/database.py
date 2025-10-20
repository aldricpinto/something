from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlmodel import SQLModel, create_engine, Session
import os

DB_PATH = os.getenv("SOULSPARK_DB_PATH", "sqlite:///./soulspark.db")
connect_args = {"check_same_thread": False} if DB_PATH.startswith("sqlite") else {}
engine = create_engine(DB_PATH, echo=False, connect_args=connect_args)


def init_db() -> None:
    # Create any missing tables first
    SQLModel.metadata.create_all(engine)
    # Lightweight, safe migrations for SQLite
    if DB_PATH.startswith("sqlite"):
        _sqlite_safe_migrations()


@contextmanager
def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def _sqlite_safe_migrations() -> None:
    """Run minimal migrations for existing local SQLite DBs.

    - Adds `user_id` column to `journalentry` if missing
    - Creates index on `journalentry(user_id)`
    """
    try:
        with engine.connect() as conn:
            # Check columns on journalentry
            cols = []
            try:
                res = conn.exec_driver_sql("PRAGMA table_info('journalentry')")
                cols = [row[1] for row in res.fetchall()]  # row[1] is column name
            except Exception:
                cols = []

            if cols and "user_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE journalentry ADD COLUMN user_id INTEGER")
                conn.exec_driver_sql(
                    "CREATE INDEX IF NOT EXISTS ix_journalentry_user_id ON journalentry(user_id)"
                )
    except Exception:
        # Best-effort; if this fails we don't block startup
        pass
