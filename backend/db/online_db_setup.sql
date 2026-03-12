-- Clinical Decision & Patient Monitoring System - PostgreSQL schema
-- Uses 3NF design with explicit constraints and indexes.

BEGIN;

-- Drop tables in reverse dependency order for easy re-runs (dev only)
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctor_availability CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS health_data CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS: doctors and admins
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    phone           VARCHAR(20) UNIQUE,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    specialization  VARCHAR(100),
    experience_years INTEGER DEFAULT 5,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT users_role_chk CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN'))
);

CREATE INDEX idx_users_role ON users(role);


-- PATIENTS
CREATE TABLE patients (
    patient_id          SERIAL PRIMARY KEY,
    user_id             INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    dob                 DATE,
    gender              VARCHAR(10),
    phone               VARCHAR(20) UNIQUE,
    address             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    primary_doctor_id   INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    ward                VARCHAR(100),

    CONSTRAINT patients_gender_chk CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'))
);

CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_primary_doctor ON patients(primary_doctor_id);


-- HEALTH DATA (time-series vitals)
CREATE TABLE health_data (
    health_id               SERIAL PRIMARY KEY,
    patient_id              INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    recorded_at             TIMESTAMPTZ NOT NULL,
    heart_rate              INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature             NUMERIC(4,1),
    glucose_level           NUMERIC(6,2),
    oxygen_saturation       NUMERIC(5,2),
    symptoms                TEXT,

    CONSTRAINT health_data_patient_recorded_uniq UNIQUE (patient_id, recorded_at),
    CONSTRAINT health_data_heart_rate_chk CHECK (heart_rate IS NULL OR heart_rate > 0),
    CONSTRAINT health_data_bp_sys_chk CHECK (blood_pressure_systolic IS NULL OR blood_pressure_systolic > 0),
    CONSTRAINT health_data_bp_dia_chk CHECK (blood_pressure_diastolic IS NULL OR blood_pressure_diastolic > 0),
    CONSTRAINT health_data_temp_chk CHECK (temperature IS NULL OR (temperature >= 30 AND temperature <= 45)),
    CONSTRAINT health_data_glucose_chk CHECK (glucose_level IS NULL OR glucose_level >= 0),
    CONSTRAINT health_data_spo2_chk CHECK (oxygen_saturation IS NULL OR (oxygen_saturation >= 0 AND oxygen_saturation <= 100))
);

CREATE INDEX idx_health_data_patient_time ON health_data(patient_id, recorded_at DESC);


-- PREDICTIONS (clinical decision support)
CREATE TABLE predictions (
    prediction_id   SERIAL PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    health_id       INTEGER REFERENCES health_data(health_id) ON DELETE SET NULL,
    risk_level      VARCHAR(10) NOT NULL,
    score           NUMERIC(5,2) NOT NULL,
    model_name      VARCHAR(100) NOT NULL,
    acknowledged    BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT predictions_risk_level_chk CHECK (risk_level IN ('LOW', 'MEDIUM', 'MODERATE', 'HIGH', 'CRITICAL')),
    CONSTRAINT predictions_score_chk CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX idx_predictions_patient_risk ON predictions(patient_id, risk_level);
CREATE INDEX idx_predictions_generated_at ON predictions(generated_at DESC);


-- DOCTOR AVAILABILITY (slots)
CREATE TABLE doctor_availability (
    availability_id SERIAL PRIMARY KEY,
    doctor_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    available_date  DATE NOT NULL,
    slot_start      TIME NOT NULL,
    slot_end        TIME NOT NULL,
    max_patients    INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT doctor_availability_time_chk CHECK (slot_end > slot_start),
    CONSTRAINT doctor_availability_max_patients_chk CHECK (max_patients > 0),
    CONSTRAINT doctor_availability_slot_uniq UNIQUE (doctor_id, available_date, slot_start)
);

CREATE INDEX idx_doctor_availability_doctor_date ON doctor_availability(doctor_id, available_date);


-- APPOINTMENTS
CREATE TABLE appointments (
    appointment_id  SERIAL PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    availability_id INTEGER REFERENCES doctor_availability(availability_id) ON DELETE RESTRICT,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    reason          TEXT,

    CONSTRAINT appointments_status_chk CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT appointments_availability_patient_uniq UNIQUE (availability_id, patient_id)
);

CREATE INDEX idx_appointments_doctor_time ON appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient_time ON appointments(patient_id, scheduled_at);


-- BILLING (header)
CREATE TABLE billing (
    billing_id      SERIAL PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    appointment_id  INTEGER NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    base_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    billed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT billing_status_chk CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    CONSTRAINT billing_base_amount_chk CHECK (base_amount >= 0),
    CONSTRAINT billing_tax_amount_chk CHECK (tax_amount >= 0),
    CONSTRAINT billing_discount_amount_chk CHECK (discount_amount >= 0),
    CONSTRAINT billing_appointment_uniq UNIQUE (appointment_id)
);

CREATE INDEX idx_billing_patient ON billing(patient_id);
CREATE INDEX idx_billing_billed_at ON billing(billed_at);


-- INVOICES (weak entity - line items per billing)
CREATE TABLE invoices (
    invoice_id  SERIAL PRIMARY KEY,
    billing_id  INTEGER NOT NULL REFERENCES billing(billing_id) ON DELETE CASCADE,
    line_no     INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
    line_total  NUMERIC(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT invoices_line_uniq UNIQUE (billing_id, line_no),
    CONSTRAINT invoices_quantity_chk CHECK (quantity > 0),
    CONSTRAINT invoices_unit_price_chk CHECK (unit_price >= 0),
    CONSTRAINT invoices_line_total_chk CHECK (line_total >= 0)
);

CREATE INDEX idx_invoices_billing ON invoices(billing_id);


-- MEDICATIONS
CREATE TABLE medications (
    medication_id       SERIAL PRIMARY KEY,
    patient_id          INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id           INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    name                VARCHAR(255) NOT NULL,
    dosage              VARCHAR(100),
    frequency           VARCHAR(100),
    instructions        TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medications_patient ON medications(patient_id);


-- SYMPTOM LOGS (Patient-reported)
CREATE TABLE symptom_logs (
    log_id              SERIAL PRIMARY KEY,
    patient_id          INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    mood                VARCHAR(50),
    pain_level          INTEGER,
    notes               TEXT,
    logged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT symptom_logs_pain_chk CHECK (pain_level >= 0 AND pain_level <= 10)
);

CREATE INDEX idx_symptom_logs_patient ON symptom_logs(patient_id, logged_at DESC);


-- LAB REPORTS
CREATE TABLE lab_reports (
    report_id           SERIAL PRIMARY KEY,
    patient_id          INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id           INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    file_path           TEXT NOT NULL,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_reports_patient ON lab_reports(patient_id);

COMMIT;

-- Stored functions / procedures for Clinical Decision & Patient Monitoring System

BEGIN;

-- Function to compute total_amount for billing
CREATE OR REPLACE FUNCTION fn_compute_billing_total(
    p_base NUMERIC,
    p_tax NUMERIC,
    p_discount NUMERIC
) RETURNS NUMERIC AS
$$
BEGIN
    RETURN COALESCE(p_base, 0) + COALESCE(p_tax, 0) - COALESCE(p_discount, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Create billing for an appointment (simplified tax/discount rules)
CREATE OR REPLACE FUNCTION fn_create_billing_for_appointment(
    p_appointment_id INTEGER,
    p_base_amount NUMERIC DEFAULT 100.00,
    p_tax_rate NUMERIC DEFAULT 0.18,       -- 18% GST-like
    p_discount_rate NUMERIC DEFAULT 0.0
) RETURNS INTEGER AS
$$
DECLARE
    v_patient_id      INTEGER;
    v_existing_id     INTEGER;
    v_tax_amount      NUMERIC;
    v_discount_amount NUMERIC;
    v_total_amount    NUMERIC;
    v_billing_id      INTEGER;
BEGIN
    SELECT patient_id
    INTO v_patient_id
    FROM appointments
    WHERE appointment_id = p_appointment_id;

    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Appointment % does not exist', p_appointment_id;
    END IF;

    SELECT billing_id
    INTO v_existing_id
    FROM billing
    WHERE appointment_id = p_appointment_id;

    IF v_existing_id IS NOT NULL THEN
        RAISE EXCEPTION 'Billing already exists for appointment %', p_appointment_id;
    END IF;

    v_tax_amount := ROUND(p_base_amount * COALESCE(p_tax_rate, 0), 2);
    v_discount_amount := ROUND(p_base_amount * COALESCE(p_discount_rate, 0), 2);
    v_total_amount := fn_compute_billing_total(p_base_amount, v_tax_amount, v_discount_amount);

    INSERT INTO billing (
        patient_id, appointment_id,
        base_amount, tax_amount, discount_amount, total_amount,
        status, billed_at
    )
    VALUES (
        v_patient_id, p_appointment_id,
        p_base_amount, v_tax_amount, v_discount_amount, v_total_amount,
        'PENDING', NOW()
    )
    RETURNING billing_id INTO v_billing_id;

    RETURN v_billing_id;
END;
$$ LANGUAGE plpgsql;


-- Get high-risk patients above a minimum score
CREATE OR REPLACE FUNCTION fn_get_high_risk_patients(
    p_min_score NUMERIC DEFAULT 70.0
) RETURNS TABLE (
    patient_id INTEGER,
    first_name VARCHAR,
    last_name  VARCHAR,
    high_risk_predictions INTEGER,
    last_score NUMERIC,
    last_prediction_at TIMESTAMPTZ
) AS
$$
BEGIN
    RETURN QUERY
    SELECT
        p.patient_id,
        p.first_name,
        p.last_name,
        COUNT(pr.prediction_id) AS high_risk_predictions,
        MAX(pr.score)           AS last_score,
        MAX(pr.generated_at)    AS last_prediction_at
    FROM patients p
    JOIN predictions pr ON pr.patient_id = p.patient_id
    WHERE pr.risk_level = 'HIGH'
      AND pr.score >= p_min_score
    GROUP BY p.patient_id, p.first_name, p.last_name
    HAVING COUNT(pr.prediction_id) > 0;
END;
$$ LANGUAGE plpgsql STABLE;


-- Book an appointment with availability checks inside a transaction-like function
CREATE OR REPLACE FUNCTION fn_book_appointment(
    p_patient_id INTEGER,
    p_doctor_id INTEGER,
    p_available_date DATE,
    p_slot_start TIME
) RETURNS INTEGER AS
$$
DECLARE
    v_availability_id INTEGER;
    v_max_patients    INTEGER;
    v_current_count   INTEGER;
    v_appointment_id  INTEGER;
BEGIN
    SELECT availability_id, max_patients
    INTO v_availability_id, v_max_patients
    FROM doctor_availability
    WHERE doctor_id = p_doctor_id
      AND available_date = p_available_date
      AND slot_start = p_slot_start
    FOR UPDATE;

    IF v_availability_id IS NULL THEN
        RAISE EXCEPTION 'No availability found for doctor %, date %, slot %',
            p_doctor_id, p_available_date, p_slot_start;
    END IF;

    SELECT COUNT(*)
    INTO v_current_count
    FROM appointments
    WHERE availability_id = v_availability_id
      AND status IN ('SCHEDULED', 'COMPLETED');

    IF v_current_count >= v_max_patients THEN
        RAISE EXCEPTION 'Slot is fully booked (availability_id=%)', v_availability_id;
    END IF;

    INSERT INTO appointments (
        patient_id,
        doctor_id,
        availability_id,
        scheduled_at,
        status,
        reason
    )
    VALUES (
        p_patient_id,
        p_doctor_id,
        v_availability_id,
        (p_available_date::timestamptz + p_slot_start),
        'SCHEDULED',
        'Scheduled via function'
    )
    RETURNING appointment_id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql;


-- Discharge a patient: complete existing appointment OR create one, then create billing
CREATE OR REPLACE FUNCTION fn_discharge_patient(
    p_patient_id     INTEGER,
    p_doctor_id      INTEGER,
    p_base_amount   NUMERIC,
    p_tax_rate      NUMERIC,
    p_discount_rate NUMERIC,
    p_notes         TEXT
) RETURNS TABLE (
    billing_id     INTEGER,
    appointment_id INTEGER,
    total_amount   NUMERIC
) AS
$$
DECLARE
    v_appt_id      INTEGER;
    v_bill_id      INTEGER;
    v_total        NUMERIC;
BEGIN
    -- 1. Look for an active (SCHEDULED) appointment (might be from a previous day)
    SELECT a.appointment_id INTO v_appt_id
    FROM appointments a
    WHERE a.patient_id = p_patient_id 
      AND a.doctor_id = p_doctor_id
      AND a.status = 'SCHEDULED'
    ORDER BY a.scheduled_at DESC
    LIMIT 1;

    -- 2. If no appointment, create a "walk-in" one for today
    IF v_appt_id IS NULL THEN
        INSERT INTO appointments (patient_id, doctor_id, availability_id, scheduled_at, status, reason)
        VALUES (p_patient_id, p_doctor_id, NULL, NOW(), 'COMPLETED', p_notes)
        RETURNING appointments.appointment_id INTO v_appt_id;
    ELSE
        UPDATE appointments SET status = 'COMPLETED', reason = p_notes 
        WHERE appointments.appointment_id = v_appt_id;
    END IF;

    -- 3. Create billing
    v_bill_id := fn_create_billing_for_appointment(v_appt_id, p_base_amount, p_tax_rate, p_discount_rate);

    -- 4. Get total
    SELECT b.total_amount INTO v_total FROM billing b WHERE b.billing_id = v_bill_id;

    RETURN QUERY SELECT v_bill_id, v_appt_id, v_total;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Sample Data for Clinical Decision & Patient Monitoring System

BEGIN;

-- 1. Sample Users (Doctors)
-- Note: password_hash is just a placeholder here
INSERT INTO users (first_name, last_name, phone, email, password_hash, role, specialization, experience_years) VALUES
('Dr. Emily', 'Smith', '555-1001', 'dr.smith@hospital.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'DOCTOR', 'Cardiology', 5),
('Dr. Michael', 'Jones', '555-1002', 'dr.jones@hospital.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'DOCTOR', 'Internal Medicine', 5),
('System', 'Admin', '555-0000', 'admin@hospital.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'ADMIN', NULL, 0),
('John', 'Doe', '555-0101', 'john.doe@example.com', 'pbkdf2_sha256$1200000$g12KCNpopJRoVaKAwdABBz$iAU6Ep4XIDKoPsrk2TaQLEjGreLoQsbdPGhCqrpZAA4=', 'PATIENT', NULL, 0);

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
