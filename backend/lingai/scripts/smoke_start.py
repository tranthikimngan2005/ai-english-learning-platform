import sys
from pathlib import Path
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

r1 = client.get('/')
r2 = client.get('/health')
print('root:', r1.status_code, r1.json())
print('health:', r2.status_code, r2.json())
