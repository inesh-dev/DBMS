-- Example advanced SQL queries demonstrating JOINs, GROUP BY/HAVING, and subqueries

-- 1) INNER JOIN: upcoming appointments with patient and doctor info
SELECT
    a.appointment_id,
    a.scheduled_at,
    a.status,
    p.first_name  AS patient_first_name,
    p.last_name   AS patient_last_name,
    u.email       AS doctor_email,
    vprs.last_risk_level
FROM appointments a
JOIN patients p ON p.patient_id = a.patient_id
JOIN users u ON u.user_id = a.doctor_id
LEFT JOIN view_patient_risk_summary vprs ON vprs.patient_id = p.patient_id
WHERE a.scheduled_at >= NOW()
ORDER BY a.scheduled_at;


-- 2) LEFT JOIN: patients and their latest vitals if present
SELECT
    p.patient_id,
    p.first_name,
    p.last_name,
    vlv.recorded_at,
    vlv.heart_rate,
    vlv.blood_pressure_systolic,
    vlv.blood_pressure_diastolic
FROM patients p
LEFT JOIN view_patient_latest_vitals vlv
       ON vlv.patient_id = p.patient_id;


-- 3) RIGHT JOIN: all availabilities and (optionally) their appointments
SELECT
    da.availability_id,
    da.available_date,
    da.slot_start,
    da.slot_end,
    a.appointment_id,
    a.patient_id
FROM appointments a
RIGHT JOIN doctor_availability da
       ON da.availability_id = a.availability_id
ORDER BY da.available_date, da.slot_start;


-- 4) GROUP BY and HAVING: doctors with more than N high-risk patients
SELECT
    u.user_id AS doctor_id,
    u.email   AS doctor_email,
    COUNT(DISTINCT p.patient_id) AS high_risk_patients
FROM users u
JOIN patients p ON p.primary_doctor_id = u.user_id
JOIN predictions pr ON pr.patient_id = p.patient_id
WHERE pr.risk_level = 'HIGH'
GROUP BY u.user_id, u.email
HAVING COUNT(DISTINCT p.patient_id) >= 3;


-- 5) Subquery: top 10 patients by count of HIGH risk predictions
SELECT
    p.patient_id,
    p.first_name,
    p.last_name,
    x.high_risk_count
FROM patients p
JOIN (
    SELECT
        patient_id,
        COUNT(*) AS high_risk_count
    FROM predictions
    WHERE risk_level = 'HIGH'
    GROUP BY patient_id
) x ON x.patient_id = p.patient_id
ORDER BY x.high_risk_count DESC
LIMIT 10;


-- 6) Correlated subquery: latest vitals for each patient without using the view
SELECT
    hd.*
FROM health_data hd
WHERE hd.recorded_at = (
    SELECT MAX(hd2.recorded_at)
    FROM health_data hd2
    WHERE hd2.patient_id = hd.patient_id
);

