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
    experience_years INTEGER DEFAULT 0,
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

