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
    -- 1. Look for an active (SCHEDULED) appointment today
    SELECT a.appointment_id INTO v_appt_id
    FROM appointments a
    WHERE a.patient_id = p_patient_id 
      AND a.doctor_id = p_doctor_id
      AND a.status = 'SCHEDULED'
      AND a.scheduled_at::date = CURRENT_DATE
    LIMIT 1;

    -- 2. If no appointment, we must create a "virtual" one or error. 
    -- For simplicity, let's auto-create a completed one if missing
    IF v_appt_id IS NULL THEN
        -- Find any availability for today or just create a dummy one if your schema allows
        -- Here we'll just error if no appointment was found to be safe, 
        -- OR we can look for the first availability of this doctor today.
        SELECT availability_id INTO v_appt_id 
        FROM doctor_availability 
        WHERE doctor_id = p_doctor_id AND available_date = CURRENT_DATE 
        LIMIT 1;

        IF v_appt_id IS NULL THEN
             RAISE EXCEPTION 'No appointment or availability found for discharge today.';
        END IF;

        INSERT INTO appointments (patient_id, doctor_id, availability_id, scheduled_at, status, reason)
        VALUES (p_patient_id, p_doctor_id, v_appt_id, NOW(), 'COMPLETED', p_notes)
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

