from pathlib import Path
import joblib
from .content import RED_FLAGS

MODEL_PATH = Path(__file__).resolve().parents[1] / "artifacts" / "disease_model.joblib"
_bundle = None

def load_bundle():
    global _bundle
    if _bundle is None:
        if not MODEL_PATH.is_file():
            raise RuntimeError("Model artifact missing. Run: python train_model.py (from backend/)")
        # Only load the artifact created by the trusted local training script.
        _bundle = joblib.load(MODEL_PATH)
    return _bundle

def predict(symptoms: list[str]):
    if set(symptoms) & RED_FLAGS:
        return {"urgent": True, "matches": []}
    bundle = load_bundle()
    vector = [[int(symptom in symptoms) for symptom in bundle["features"]]]
    probabilities = bundle["model"].predict_proba(vector)[0]
    classes = bundle["model"].classes_
    results = sorted(zip(classes, probabilities), key=lambda entry: entry[1], reverse=True)[:3]
    return {
        "urgent": False,
        "matches": [{"slug": str(slug), "score": round(float(score) * 100, 1)} for slug, score in results],
    }
