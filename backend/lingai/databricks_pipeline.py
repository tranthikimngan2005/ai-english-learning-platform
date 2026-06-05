import json
from pathlib import Path
from sqlalchemy import text
from app.core.database import engine


def export_sql_results(rows, output_path: Path):
    data = [dict(row) for row in rows]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', encoding='utf-8') as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)
    print(f"Exported {len(data)} records to {output_path}")


def export_questions(output_dir: Path):
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id, skill, part, level, q_type, content, options, correct_answer, passage, explanation, tags, ai_prompt, audio_url FROM questions"
        )).mappings().all()
    export_sql_results(rows, output_dir / 'questions.json')


def export_review_cards(output_dir: Path):
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT rc.id, rc.user_id, rc.question_id, rc.interval_days, rc.ease_factor, rc.repetitions, rc.due_date, rc.last_reviewed, q.content AS question_content, q.correct_answer AS question_correct_answer "
            "FROM review_cards rc JOIN questions q ON rc.question_id = q.id"
        )).mappings().all()
    export_sql_results(rows, output_dir / 'review_cards.json')


def main(output_dir: str = 'databricks_training_data'):
    out = Path(output_dir)
    print(f"Exporting training data to {out.resolve()}")
    export_questions(out)
    export_review_cards(out)
    print('Databricks training data export finished.')


if __name__ == '__main__':
    main()
