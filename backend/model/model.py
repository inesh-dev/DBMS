import joblib
import pandas as pd

pipeline = joblib.load("risk_predictor.pkl")
patient_input = {
    "Heart Rate": 150,               # Tachycardia, >140 bpm can be critical
    "Respiratory Rate": 35,          # Severe tachypnea, >30 is alarming
    "Body Temperature": 40.5,        # Hyperpyrexia, >40°C is dangerous
    "Oxygen Saturation": 85,         # Hypoxemia, <90% is critical
    "Systolic Blood Pressure": 180,  # Hypertensive crisis
    "Diastolic Blood Pressure": 120, # Hypertensive crisis
    "Age": 65,                        # Older age increases risk
    "Gender": 1,                      # Gender encoding same as your system
    "Weight (kg)": 120,               # Obesity-related risk
    "Height (m)": 1.75,               # Same as normal
    "Derived_HRV": 20,                # Very low HRV indicates poor autonomic function
    "Derived_Pulse_Pressure": 60,     # High PP indicates arterial stiffness
    "Derived_BMI": 39,                # Obesity class II-III
    "Derived_MAP": 130                 # Mean arterial pressure dangerously high
}

def predict_risk(patient_input):
    patient_input_df = pd.DataFrame([patient_input])  # keep keys as column names
    y_pred = pipeline.predict(patient_input_df)
    y_pred_proba = pipeline.predict_proba(patient_input_df)[:, 1]  # risk probability
    y_pred = "HIGH RISK" if y_pred[0] == 1 else "LOW RISK"
    print(y_pred, f"\nRisk probability: {y_pred_proba[0]*100:.2f}%")

