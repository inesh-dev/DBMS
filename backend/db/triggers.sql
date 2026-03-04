-- Triggers for Clinical Decision & Patient Monitoring System

BEGIN;

-- Ensure total_amount is always consistent before insert/update on billing
CREATE OR REPLACE FUNCTION trg_billing_set_total()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.total_amount := fn_compute_billing_total(
        NEW.base_amount,
        NEW.tax_amount,
        NEW.discount_amount
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS billing_set_total_biur ON billing;
CREATE TRIGGER billing_set_total_biur
BEFORE INSERT OR UPDATE ON billing
FOR EACH ROW
EXECUTE FUNCTION trg_billing_set_total();


-- Prevent overbooking beyond max_patients on appointments
CREATE OR REPLACE FUNCTION trg_appointments_check_capacity()
RETURNS TRIGGER AS
$$
DECLARE
    v_max_patients  INTEGER;
    v_current_count INTEGER;
BEGIN
    SELECT max_patients
    INTO v_max_patients
    FROM doctor_availability
    WHERE availability_id = NEW.availability_id
    FOR UPDATE;

    IF v_max_patients IS NULL THEN
        RAISE EXCEPTION 'Availability % not found', NEW.availability_id;
    END IF;

    SELECT COUNT(*)
    INTO v_current_count
    FROM appointments
    WHERE availability_id = NEW.availability_id
      AND status IN ('SCHEDULED', 'COMPLETED');

    IF TG_OP = 'INSERT' THEN
        IF v_current_count >= v_max_patients THEN
            RAISE EXCEPTION 'Cannot book: slot capacity exceeded for availability %', NEW.availability_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If changing status back to active, re-check capacity
        IF NEW.status IN ('SCHEDULED', 'COMPLETED')
           AND (OLD.status NOT IN ('SCHEDULED', 'COMPLETED')
                OR NEW.availability_id <> OLD.availability_id) THEN
            IF v_current_count >= v_max_patients THEN
                RAISE EXCEPTION 'Cannot re-activate booking: slot capacity exceeded for availability %', NEW.availability_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_check_capacity_biub ON appointments;
CREATE TRIGGER appointments_check_capacity_biub
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION trg_appointments_check_capacity();


-- Simple rule-based flagging: auto-insert a HIGH risk prediction on extreme vitals
CREATE OR REPLACE FUNCTION trg_health_data_auto_prediction()
RETURNS TRIGGER AS
$$
DECLARE
    v_score NUMERIC(5,2) := 0;
    v_risk  VARCHAR(10) := 'LOW';
BEGIN
    -- Very naive rules for demonstration
    IF NEW.heart_rate IS NOT NULL AND (NEW.heart_rate < 40 OR NEW.heart_rate > 130) THEN
        v_score := v_score + 30;
    END IF;
    IF NEW.blood_pressure_systolic IS NOT NULL AND NEW.blood_pressure_systolic > 180 THEN
        v_score := v_score + 30;
    END IF;
    IF NEW.oxygen_saturation IS NOT NULL AND NEW.oxygen_saturation < 90 THEN
        v_score := v_score + 40;
    END IF;

    IF v_score >= 70 THEN
        v_risk := 'HIGH';
    ELSIF v_score >= 40 THEN
        v_risk := 'MEDIUM';
    ELSE
        v_risk := 'LOW';
    END IF;

    INSERT INTO predictions (
        patient_id,
        health_id,
        risk_level,
        score,
        model_name,
        generated_at
    )
    VALUES (
        NEW.patient_id,
        NEW.health_id,
        v_risk,
        v_score,
        'RULE_BASED_TRIGGER',
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS health_data_auto_prediction_ai ON health_data;
CREATE TRIGGER health_data_auto_prediction_ai
AFTER INSERT ON health_data
FOR EACH ROW
EXECUTE FUNCTION trg_health_data_auto_prediction();

COMMIT;

