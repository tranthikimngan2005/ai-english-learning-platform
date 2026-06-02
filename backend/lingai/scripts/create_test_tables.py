import sys
from pathlib import Path
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine
from app.core.database import Base
import app.models.user  # ensure models are imported

TEST_DB_URL = "sqlite:///./test_pengwin.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
print('created')
