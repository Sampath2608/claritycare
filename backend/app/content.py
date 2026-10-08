SYMPTOM_GROUPS = {
    "General": [
        ("fever", "Fever"), ("fatigue", "Fatigue"), ("body_aches", "Body aches"),
        ("chills", "Chills"), ("loss_of_appetite", "Loss of appetite"), ("dizziness", "Dizziness")
    ],
    "Breathing & throat": [
        ("cough", "Cough"), ("sore_throat", "Sore throat"), ("runny_nose", "Runny nose"),
        ("sneezing", "Sneezing"), ("congestion", "Nasal congestion"), ("itchy_eyes", "Itchy eyes")
    ],
    "Digestive": [
        ("nausea", "Nausea"), ("vomiting", "Vomiting"), ("diarrhea", "Diarrhea"),
        ("abdominal_pain", "Abdominal pain")
    ],
    "Head & senses": [
        ("headache", "Headache"), ("light_sensitivity", "Light sensitivity"),
        ("sound_sensitivity", "Sound sensitivity"), ("muscle_tension", "Muscle tension"),
        ("stress", "Stress")
    ],
    "Potential urgent symptoms": [
        ("chest_pain", "Chest pain"), ("shortness_of_breath", "Difficulty breathing"),
        ("confusion", "New confusion"), ("fainting", "Fainting"),
        ("sudden_severe_headache", "Sudden severe headache")
    ]
}
SYMPTOMS = {key: label for group in SYMPTOM_GROUPS.values() for key, label in group}
RED_FLAGS = {"chest_pain", "shortness_of_breath", "confusion", "fainting", "sudden_severe_headache"}

# Editorial content for general education. Not treatment guidance or diagnosis.
CONDITIONS = [
    dict(slug="cold-like", name="Common cold-like symptoms", summary="A group of upper-respiratory symptoms that may occur with a common cold or other infections. Symptoms alone cannot establish the cause.", common_symptoms=["Runny nose", "Sneezing", "Sore throat", "Cough"], prevention="Wash hands, cover coughs, and limit close contact when unwell.", when_to_seek_care="Seek care for persistent or worsening symptoms, dehydration, or any difficulty breathing."),
    dict(slug="flu-like", name="Flu-like symptoms", summary="Fever, aches and fatigue can occur with influenza and several other viral illnesses. Testing and a clinical assessment may be needed.", common_symptoms=["Fever", "Body aches", "Chills", "Fatigue", "Cough"], prevention="Stay current on recommended vaccinations and practise hand hygiene.", when_to_seek_care="Contact a clinician if you are at higher risk, feel significantly unwell, or symptoms worsen. Seek urgent care for breathing difficulty."),
    dict(slug="allergy-like", name="Seasonal allergy-like symptoms", summary="Sneezing, an itchy nose or eyes and a runny nose may occur with environmental allergies but can also have other causes.", common_symptoms=["Sneezing", "Itchy eyes", "Runny nose", "Congestion"], prevention="Reduce exposure to triggers when possible and follow local pollen reports.", when_to_seek_care="See a clinician for persistent symptoms, breathing problems, or uncertainty about the cause."),
    dict(slug="stomach-like", name="Gastrointestinal illness-like symptoms", summary="Nausea, abdominal discomfort, vomiting, and diarrhea can have many causes, including infections and food-related illness.", common_symptoms=["Nausea", "Vomiting", "Diarrhea", "Abdominal pain"], prevention="Wash hands, practise food safety, and use clean water.", when_to_seek_care="Seek care for dehydration, severe or localized abdominal pain, blood in vomit or stool, or symptoms that persist."),
    dict(slug="migraine-like", name="Migraine-like headache symptoms", summary="A headache with light or sound sensitivity and nausea can resemble migraine, although other causes must be considered.", common_symptoms=["Headache", "Light sensitivity", "Sound sensitivity", "Nausea"], prevention="Track headache patterns and discuss recurrent symptoms with a clinician.", when_to_seek_care="Seek emergency care for sudden severe headache, new weakness, confusion, or a new severe neurologic symptom."),
    dict(slug="tension-like", name="Tension-type headache-like symptoms", summary="Pressure-like headache with neck or muscle tension can resemble tension-type headache. A clinician can assess frequent or changing headaches.", common_symptoms=["Headache", "Muscle tension", "Stress"], prevention="Regular rest, breaks, hydration, and stress-management habits may support general wellbeing.", when_to_seek_care="Seek care for headaches that are new, persistent, worsening, or associated with other concerning symptoms."),
]

def health_answer(question: str):
    q = question.lower().strip()
    if any(word in q for word in ["chest pain", "can't breathe", "cannot breathe", "difficulty breathing", "fainting", "passed out", "sudden severe headache", "new confusion", "stroke", "suicide", "self-harm"]):
        return "Some symptoms in your question may indicate an emergency. Seek immediate in-person medical help or call your local emergency number. This chat cannot assess urgent symptoms."
    if any(word in q for word in ["diagnose", "do i have", "what disease", "my diagnosis", "which medicine", "dosage", "antibiotic", "prescribe", "medication should"]):
        return "I can't diagnose a condition or recommend individual medicines or dosages. A qualified clinician can assess your symptoms and medical history. I can help explain general condition information or prepare questions for an appointment."
    if "flu" in q or "influenza" in q:
        return "Flu-like illness often involves fever, chills, body aches, fatigue, and cough. Other illnesses can look similar. A clinician can advise whether testing or prompt assessment is needed, especially for people at higher risk."
    if "cold" in q or "cough" in q:
        return "Common cold-like symptoms include a runny nose, cough, sneezing, and sore throat. Similar symptoms can occur with other infections or allergies. Seek care if symptoms persist or worsen."
    if "allerg" in q or "sneez" in q:
        return "Environmental allergies may cause sneezing, itchy eyes and nasal congestion. A clinician can help distinguish allergies from infections and discuss appropriate options."
    if "headache" in q or "migraine" in q:
        return "Headaches have many causes. Keeping track of timing, duration and accompanying symptoms can be useful at an appointment. A sudden severe headache or headache with new neurologic symptoms needs emergency assessment."
    if any(word in q for word in ["stomach", "diarrhea", "vomit", "nausea"]):
        return "Digestive symptoms may arise from several causes. Dehydration, significant pain, blood in vomit or stool, or continuing symptoms are reasons to seek medical advice promptly."
    if "prediction" in q or "score" in q or "confidence" in q:
        return "The app's percentages are ranking scores from a model trained on synthetic educational examples. They are not clinical probabilities or measures of whether you have a disease. They cannot rule in or rule out any illness."
    if "doctor" in q or "appointment" in q:
        return "Helpful questions for a clinician include: What possible causes should we consider? Are tests needed? Which symptoms should prompt urgent care? What follow-up is appropriate? Bring a timeline of your symptoms."
    return "I can share general educational information about colds, flu-like illness, allergies, headaches, gastrointestinal symptoms, or explain the demo prediction score. For personal health decisions, please consult a qualified healthcare professional."
