import sqlite3
import sys

path = 'test_pengwin.db'
if len(sys.argv) > 1:
    path = sys.argv[1]

conn = sqlite3.connect(path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print(cur.fetchall())
conn.close()
