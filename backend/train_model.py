"""Train a *synthetic-data-only* educational model. Never claim clinical validity.

The synthetic training and test sets are generated from the same toy assumptions.
Their scores cannot establish real-world diagnostic performance.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from app.content import SYMPTOMS, RED_FLAGS

FEATURES = [name for name in SYMPTOMS if name not in RED_FLAGS]
PROFILES = {
    "cold-like": {"runny_nose": .88, "sneezing": .75, "cough": .74, "sore_throat": .67, "congestion": .72, "fatigue": .30, "fever": .17},
    "flu-like": {"fever": .88, "body_aches": .85, "chills": .80, "fatigue": .92, "cough": .65, "headache": .64, "sore_throat": .34},
    "allergy-like": {"sneezing": .95, "itchy_eyes": .91, "runny_nose": .87, "congestion": .73, "cough": .19},
    "stomach-like": {"nausea": .90, "vomiting": .69, "diarrhea": .75, "abdominal_pain": .88, "loss_of_appetite": .59, "fatigue": .37},
    "migraine-like": {"headache": .97, "light_sensitivity": .89, "sound_sensitivity": .86, "nausea": .69, "dizziness": .27, "fatigue": .19},
    "tension-like": {"headache": .92, "muscle_tension": .93, "stress": .81, "fatigue": .39, "dizziness": .22},
}

def make_data(seed=42, per_class=300):
    rng = np.random.default_rng(seed)
    x, y = [], []
    for label, profile in PROFILES.items():
        for _ in range(per_class):
            sample = [int(rng.random() < profile.get(symptom, .025)) for symptom in FEATURES]
            if not any(sample):
                sample[FEATURES.index(max(profile, key=profile.get))] = 1
            x.append(sample)
            y.append(label)
    return np.array(x), np.array(y)

def train():
    x, y = make_data()
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=.25, stratify=y, random_state=42)
    candidates = {
        "logistic_regression": LogisticRegression(max_iter=1000),
        "random_forest": RandomForestClassifier(n_estimators=100, max_depth=9, random_state=42),
        "decision_tree": DecisionTreeClassifier(max_depth=8, random_state=42),
    }
    metrics = {}
    for name, model in candidates.items():
        model.fit(x_train, y_train)
        pred = model.predict(x_test)
        metrics[name] = {"synthetic_accuracy": round(float(accuracy_score(y_test, pred)), 4), "synthetic_macro_f1": round(float(f1_score(y_test, pred, average="macro")), 4)}
    best_name = max(metrics, key=lambda name: metrics[name]["synthetic_macro_f1"])
    # This is a demo model-selection split; a separate untouched holdout would be required
    # for meaningful final performance reporting, in addition to real clinical validation.
    best = candidates[best_name]
    artifact_dir = Path(__file__).parent / "artifacts"
    artifact_dir.mkdir(exist_ok=True)
    joblib.dump({"features": FEATURES, "model": best}, artifact_dir / "disease_model.joblib")
    metadata = {"dataset": "Synthetic demonstration data, not patient records", "model": best_name, "selection_metrics_not_clinically_validated": metrics, "trained_at": datetime.now(timezone.utc).isoformat()}
    (artifact_dir / "training_metadata.json").write_text(json.dumps(metadata, indent=2))
    print(json.dumps(metadata, indent=2))

if __name__ == "__main__":
    train()
