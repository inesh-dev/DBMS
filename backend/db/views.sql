-- Database views for Clinical Decision & Patient Monitoring System

BEGIN;

-- Latest vitals per patient
CREATE OR REPLACE VIEW view_patient_latest_vitals AS
SELECT DISTINCT ON (hd.patient_id)
    hd.patient_id,
    p.first_name,
    p.last_name,
    hd.health_id,
    hd.recorded_at,
    hd.heart_rate,
    hd.blood_pressure_systolic,
    hd.blood_pressure_diastolic,
    hd.temperature,
    hd.glucose_level,
    hd.oxygen_saturation
FROM health_data hd
JOIN patients p ON p.patient_id = hd.patient_id
ORDER BY hd.patient_id, hd.recorded_at DESC;


-- Patient risk summary: aggregate predictions
CREATE OR REPLACE VIEW view_patient_risk_summary AS
SELECT
    p.patient_id,
    p.first_name,
    p.last_name,
    COUNT(pr.prediction_id) AS total_predictions,
    AVG(pr.score)           AS avg_score,
    MAX(pr.score)           AS max_score,
    MAX(pr.generated_at)    AS last_prediction_at,
    -- last risk level by time
    (SELECT pr2.risk_level
     FROM predictions pr2
     WHERE pr2.patient_id = p.patient_id
     ORDER BY pr2.generated_at DESC
     LIMIT 1) AS last_risk_level
FROM patients p
LEFT JOIN predictions pr ON pr.patient_id = p.patient_id
GROUP BY p.patient_id, p.first_name, p.last_name;


-- Doctor schedule summary: availability vs booked appointments
CREATE OR REPLACE VIEW view_doctor_schedule_summary AS
SELECT
    da.availability_id,
    da.doctor_id,
    u.email            AS doctor_email,
    da.available_date,
    da.slot_start,
    da.slot_end,
    da.max_patients,
    COUNT(a.appointment_id) AS booked_patients
FROM doctor_availability da
JOIN users u ON u.user_id = da.doctor_id
LEFT JOIN appointments a ON a.availability_id = da.availability_id
GROUP BY
    da.availability_id,
    da.doctor_id,
    u.email,
    da.available_date,
    da.slot_start,
    da.slot_end,
    da.max_patients;


-- Monthly billing revenue summary
CREATE OR REPLACE VIEW view_billing_revenue_monthly AS
SELECT
    DATE_TRUNC('month', billed_at) AS month,
    SUM(base_amount)               AS total_base_amount,
    SUM(tax_amount)                AS total_tax_amount,
    SUM(discount_amount)          AS total_discount_amount,
    SUM(total_amount)              AS total_revenue,
    COUNT(*)                       AS bills_count
FROM billing
GROUP BY DATE_TRUNC('month', billed_at)
ORDER BY month DESC;

COMMIT;

