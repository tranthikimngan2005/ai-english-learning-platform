"""
SM-2 Spaced Repetition algorithm.
Grades: again=0, hard=1, good=3, easy=5
"""
from datetime import datetime, timedelta
from app.models.user import ReviewResultEnum

GRADE_MAP = {
    ReviewResultEnum.again: 0,
    ReviewResultEnum.hard:  1,
    ReviewResultEnum.good:  3,
    ReviewResultEnum.easy:  5,
}


def calculate_next_review(
    interval: int,
    ease_factor: float,
    repetitions: int,
    result: ReviewResultEnum,
) -> tuple[int, float, int, datetime]:
    """
    Returns (new_interval, new_ease, new_repetitions, due_date)
    """
    grade = GRADE_MAP[result]

    if grade < 2:
        # failed — reset
        new_interval = 1
        new_reps = 0
    else:
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)
        new_reps = repetitions + 1

    # update ease factor (SM-2 formula)
    new_ease = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    new_ease = max(1.3, new_ease)  # floor at 1.3

    due_date = datetime.utcnow() + timedelta(days=new_interval)
    return new_interval, round(new_ease, 4), new_reps, due_date


def level_up_check(questions_done: int, questions_correct: int, target_done: int = 50, target_accuracy: float = 75.0) -> bool:
    """Returns True if learner qualifies to advance level."""
    if questions_done < target_done:
        return False
    accuracy = (questions_correct / questions_done) * 100
    return accuracy >= target_accuracy


LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]

def next_level(current: str) -> str | None:
    idx = LEVEL_ORDER.index(current)
    if idx < len(LEVEL_ORDER) - 1:
        return LEVEL_ORDER[idx + 1]
    return None
