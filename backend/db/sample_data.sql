-- Sample Data for Clinical Decision & Patient Monitoring System

BEGIN;

-- 1. Sample Users (Doctors)
-- Note: password_hash is just a placeholder here
INSERT INTO users (phone, email, password_hash, role, specialization) VALUES
('555-1001', 'dr.smith@hospital.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'DOCTOR', 'Cardiology'),
('555-1002', 'dr.jones@hospital.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'DOCTOR', 'Internal Medicine'),
('555-0000', 'admin@hospital.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'ADMIN', NULL),
('555-0101', 'john.doe@example.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'PATIENT', NULL);

-- 2. Sample Patients
INSERT INTO patients (user_id, first_name, last_name, dob, gender, phone, address, primary_doctor_id) VALUES
(4, 'John', 'Doe', '1980-05-15', 'MALE', '555-0101', '123 Maple St, Cityville', 1),
(NULL, 'Jane', 'Roe', '1992-08-22', 'FEMALE', '555-0102', '456 Oak Rd, Townsville', 1),
(NULL, 'Alice', 'Smith', '1975-03-10', 'FEMALE', '555-0103', '789 Pine Ln, Villagetown', 2),
(NULL, 'Bob', 'Brown', '1960-11-30', 'MALE', '555-0104', '321 Birch Blvd, Metrocity', 2);

-- 3. Sample Health Data (Vitals)
-- Current time reference for recent data
INSERT INTO health_data (patient_id, recorded_at, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, temperature, glucose_level, oxygen_saturation) VALUES
(1, NOW() - INTERVAL '1 hour', 72, 120, 80, 36.6, 95.0, 98.0),
(1, NOW(), 135, 185, 110, 37.2, 100.0, 88.0), -- Should trigger a HIGH risk alert via trigger
(2, NOW() - INTERVAL '2 hours', 68, 115, 75, 36.5, 90.0, 99.0),
(2, NOW(), 70, 118, 76, 36.7, 92.0, 98.5),
(3, NOW() - INTERVAL '3 hours', 85, 130, 85, 37.0, 140.0, 96.0),
(4, NOW(), 110, 145, 95, 38.5, 110.0, 94.0);

-- 4. Sample Doctor Availability
INSERT INTO doctor_availability (doctor_id, available_date, slot_start, slot_end, max_patients) VALUES
(1, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:00:00', 1),
(1, CURRENT_DATE + INTERVAL '1 day', '10:00:00', '11:00:00', 1),
(2, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:00:00', 2),
(1, CURRENT_DATE + INTERVAL '2 days', '14:00:00', '15:00:00', 1);

-- 5. Sample Appointments
INSERT INTO appointments (patient_id, doctor_id, availability_id, scheduled_at, status, reason) VALUES
(1, 1, 1, CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours', 'SCHEDULED', 'Routine checkup'),
(2, 1, 2, CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours', 'SCHEDULED', 'Follow-up on vitals'),
(3, 2, 3, CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours', 'SCHEDULED', 'Consultation');

-- 6. Sample Billing (already completed appointments)
INSERT INTO appointments (patient_id, doctor_id, availability_id, scheduled_at, status, reason) VALUES
(4, 2, 3, CURRENT_DATE - INTERVAL '1 day' + INTERVAL '9 hours', 'COMPLETED', 'Initial Visit');

-- Manually insert billing for the completed appointment
INSERT INTO billing (patient_id, appointment_id, base_amount, tax_amount, discount_amount, total_amount, status, billed_at)
SELECT patient_id, appointment_id, 150.00, 27.00, 0, 177.00, 'PAID', NOW() - INTERVAL '1 day'
FROM appointments WHERE status = 'COMPLETED' LIMIT 1;

COMMIT;
