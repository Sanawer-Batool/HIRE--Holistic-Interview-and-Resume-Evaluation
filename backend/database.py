import sqlite3
import os

# This builds the correct absolute path no matter where you run from
# __file__ = this database.py file
# dirname  = the backend/ folder
# ..       = goes up to HIRE-Project/ where candidates.db lives
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "candidates.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

