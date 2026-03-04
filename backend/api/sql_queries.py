# Raw SQL queries for the Clinical Decision & Patient Monitoring System

# 1. Latest vitals per patient (using view)
GET_LATEST_VITALS = """
SELECT * FROM view_patient_latest_vitals;
"""

# 2. Latest vitals for a specific patient
GET_PATIENT_LATEST_VITALS = """
SELECT * FROM view_patient_latest_vitals WHERE patient_id = %s;
"""

# 3. Patient risk summary (using view)
GET_RISK_SUMMARY = """
SELECT * FROM view_patient_risk_summary;
"""

# 4. High-risk patients (using stored procedure)
GET_HIGH_RISK_PATIENTS = """
SELECT * FROM fn_get_high_risk_patients(%s);
"""

# 5. Doctor schedule summary (using view)
GET_DOCTOR_SCHEDULE = """
SELECT * FROM view_doctor_schedule_summary WHERE doctor_id = %s;
"""

# 6. Book an appointment (using stored procedure)
BOOK_APPOINTMENT = """
SELECT fn_book_appointment(%s, %s, %s, %s) AS appointment_id;
"""

# 7. Create billing for an appointment (using stored procedure)
CREATE_BILLING = """
SELECT fn_create_billing_for_appointment(%s, %s, %s, %s) AS billing_id;
"""

# 8. Monthly revenue (using view)
GET_MONTHLY_REVENUE = """
SELECT * FROM view_billing_revenue_monthly;
"""

# 9. Add new patient
ADD_PATIENT = """
INSERT INTO patients (first_name, last_name, dob, gender, phone, address, primary_doctor_id)
VALUES (%s, %s, %s, %s, %s, %s, %s)
RETURNING patient_id;
"""

# 11. Add new health data record (vitals)
ADD_VITALS = """
INSERT INTO health_data (patient_id, recorded_at, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, temperature, glucose_level, oxygen_saturation)
VALUES (%s, NOW(), %s, %s, %s, %s, %s, %s)
RETURNING health_id;
"""

# 10. Get all patients with their latest vitals
GET_ALL_PATIENTS = """
SELECT DISTINCT ON (p.patient_id)
    p.patient_id, 
    p.first_name, 
    p.last_name, 
    p.gender, 
    p.dob, 
    p.phone, 
    p.address, 
    p.created_at,
    hd.recorded_at,
    hd.heart_rate,
    hd.blood_pressure_systolic,
    hd.blood_pressure_diastolic,
    hd.temperature,
    hd.glucose_level,
    hd.oxygen_saturation
FROM patients p
LEFT JOIN health_data hd ON p.patient_id = hd.patient_id
ORDER BY p.patient_id, hd.recorded_at DESC;
"""

# 11. Discharge a patient — complete appointment + create billing
DISCHARGE_PATIENT = """
SELECT * FROM fn_discharge_patient(%s, %s, %s, %s, %s, %s);
"""

# 12. Add doctor availability
ADD_AVAILABILITY = """
INSERT INTO doctor_availability (doctor_id, available_date, slot_start, slot_end, max_patients)
VALUES (%s, %s, %s, %s, %s)
RETURNING availability_id;
"""

