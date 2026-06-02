import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services import analytics_service



def test_recommendation_and_failed_tag_snapshot_override(tmp_path, monkeypatch):
    snapshot_path = tmp_path / "recommendations_snapshot.json"
    snapshot = {
        "generated_at": "2026-06-02T00:00:00Z",
        "failed_tags": [{"tag": "Grammar-Tenses", "fail_count": 7}],
        "recommendations": {
            "42": [
                {
                    "question": {
                        "id": 1,
                        "lesson_id": None,
                        "skill": "reading",
                        "part": 5,
                        "level": 500,
                        "q_type": "mcq",
                        "content": "She _____ the report yesterday.",
                        "options": ["write", "writes", "wrote", "writing"],
                        "correct_answer": "wrote",
                        "passage": None,
                        "explanation": "Use past simple because of yesterday.",
                        "tags": "Grammar-Tenses",
                        "audio_url": None,
                        "status": "approved",
                        "creator_id": 9,
                        "created_at": "2026-06-01T10:00:00Z",
                    },
                    "next_review": "2026-06-02T12:00:00Z",
                }
            ]
        },
    }
    snapshot_path.write_text(json.dumps(snapshot), encoding="utf-8")
    monkeypatch.setattr(analytics_service.settings, "ANALYTICS_BATCH_SNAPSHOT_PATH", str(snapshot_path))

    recs = analytics_service.get_recommendations(42, db=None)
    assert len(recs) == 1
    assert recs[0]["question"]["id"] == 1
    assert recs[0]["next_review"] == "2026-06-02T12:00:00Z"

    failed_tags = analytics_service.build_failed_tag_counts(db=None)
    assert failed_tags == [{"tag": "Grammar-Tenses", "fail_count": 7}]
