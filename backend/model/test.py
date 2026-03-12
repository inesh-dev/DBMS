from id_card import predict_risk

patient_input = {
    "Heart Rate": 148,                 # Severe tachycardia
    "Respiratory Rate": 34,            # Critical tachypnea
    "Body Temperature": 40.2,          # Hyperpyrexia
    "Oxygen Saturation": 82,           # Severe hypoxemia
    "Systolic Blood Pressure": 82,     # Hypotension
    "Diastolic Blood Pressure": 48,    # Shock-level diastolic BP
    "Age": 72,                         # High-risk age
    "Gender": 1,                       # Male
    "Weight (kg)": 54,                 # Underweight
    "Height (m)": 1.70,
    "Derived_HRV": 18,                 # Critically low HRV
    "Derived_Pulse_Pressure": 34,      # Narrow pulse pressure
    "Derived_BMI": 18.7,               # Underweight BMI
    "Derived_MAP": 59                  # Organ perfusion failure
}

predict_risk(patient_input)
