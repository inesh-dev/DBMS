from django.db import connection, transaction
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import string
import random
import os
import numpy as np
import pandas as pd
import joblib
from django.contrib.auth.hashers import make_password
import threading
import logging
from . import sql_queries

logger = logging.getLogger(__name__)

# ─── ML Model Loading ────────────────────────────────────────────────────────
# Load the trained scikit-learn pipeline once at server startup.
# The model file lives at: backend/model/risk_predictor.pkl
_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'model', 'risk_predictor.pkl')
try:
    _RISK_MODEL = joblib.load(_MODEL_PATH)
    print(f"[ML MODEL] risk_predictor.pkl loaded successfully from {_MODEL_PATH}")
except Exception as e:
    _RISK_MODEL = None
    print(f"[ML MODEL] WARNING: Could not load risk_predictor.pkl — {e}")

# Exact feature column order that the model was trained on
_MODEL_FEATURES = [
    'Heart Rate',
    'Respiratory Rate',
    'Body Temperature',
    'Oxygen Saturation',
    'Systolic Blood Pressure',
    'Diastolic Blood Pressure',
    'Age',
    'Gender',
    'Weight (kg)',
    'Height (m)',
    'Derived_HRV',
    'Derived_Pulse_Pressure',
    'Derived_BMI',
    'Derived_MAP',
]


def predict_vitals(vitals_data: dict) -> dict:
    """
    Run the ML pipeline on patient vitals and return a structured prediction.

    Args:
        vitals_data: dict with keys matching frontend field names:
            heart_rate, blood_pressure_systolic, blood_pressure_diastolic,
            oxygen_saturation, temperature, age, gender, weight, height,
            respiratory_rate (all optional — safe defaults applied)

    Returns:
        dict with keys: risk_level (str), risk_score (int 0-100), message (str)
        If the model is unavailable, returns {'error': reason}.
    """
    if _RISK_MODEL is None:
        return {'error': 'ML model is not loaded. Please check server logs.'}

    try:
        # ── Validate required fields exist and are > 0 ────────────────────────
        hr_val  = vitals_data.get('heart_rate')
        sys_val = vitals_data.get('blood_pressure_systolic')
        dia_val = vitals_data.get('blood_pressure_diastolic')

        if not hr_val or float(hr_val) <= 0:
            return {'error': 'Heart rate is required and must be positive.'}
        if not sys_val or float(sys_val) <= 0:
            return {'error': 'Systolic blood pressure is required and must be positive.'}
        if not dia_val or float(dia_val) <= 0:
            return {'error': 'Diastolic blood pressure is required and must be positive.'}

        # ── Extract raw vitals ────────────────────────────────────────────────
        heart_rate   = float(hr_val) if hr_val is not None else 0.0
        sys_bp       = float(sys_val) if sys_val is not None else 0.0
        dia_bp       = float(dia_val) if dia_val is not None else 0.0
        
        # Safe defaults for non-critical/optional fields
        def safe_float(key: str, default: float) -> float:
            val = vitals_data.get(key)
            return float(val) if val is not None and val != '' else default

        oxygen       = safe_float('oxygen_saturation', 98.0)
        temperature  = safe_float('temperature', 37.0)
        age          = safe_float('age', 35.0)
        gender       = safe_float('gender', 0.0)   # 0=Female, 1=Male
        weight       = safe_float('weight', 70.0)  # kg
        height       = safe_float('height', 1.70)  # m
        resp_rate    = safe_float('respiratory_rate', 16.0)

        # ── Derive engineered features (same as training notebook) ─────────
        # HRV approximation: higher heart rate → lower HRV
        hrv               = round(1000 / heart_rate, 4) if heart_rate > 0 else 13.3
        pulse_pressure    = sys_bp - dia_bp                    # arterial stiffness proxy
        bmi               = round(weight / (height ** 2), 4)   # body mass index
        map_pressure      = round(dia_bp + (sys_bp - dia_bp) / 3, 4)  # mean arterial pressure

        # ── Build DataFrame in exact model feature order ───────────────────
        row = {
            'Heart Rate':              heart_rate,
            'Respiratory Rate':        resp_rate,
            'Body Temperature':        temperature,
            'Oxygen Saturation':       oxygen,
            'Systolic Blood Pressure': sys_bp,
            'Diastolic Blood Pressure': dia_bp,
            'Age':                     age,
            'Gender':                  gender,
            'Weight (kg)':             weight,
            'Height (m)':              height,
            'Derived_HRV':             hrv,
            'Derived_Pulse_Pressure':  pulse_pressure,
            'Derived_BMI':             bmi,
            'Derived_MAP':             map_pressure,
        }
        df = pd.DataFrame([row], columns=_MODEL_FEATURES)

        # ── Run prediction ─────────────────────────────────────────────────
        raw_pred   = _RISK_MODEL.predict(df)[0]           # 0 = LOW, 1 = HIGH
        proba      = _RISK_MODEL.predict_proba(df)[0][1]  # probability of HIGH RISK
        risk_score = int(round(proba * 100))              # 0–100 percentage

        # ── Map score to 4-tier risk levels ───────────────────────────────
        if risk_score >= 75:
            risk_level = 'CRITICAL'
            message    = 'Patient vitals indicate a critical risk level. Immediate medical attention is strongly recommended.'
        elif risk_score >= 50:
            risk_level = 'HIGH'
            message    = 'Patient vitals indicate elevated risk. Doctor attention is recommended as soon as possible.'
        elif risk_score >= 25:
            risk_level = 'MODERATE'
            message    = 'Some vitals are slightly out of range. Monitor closely and consider a routine check-up.'
        else:
            risk_level = 'LOW'
            message    = 'Your vitals look healthy! Keep up the great lifestyle habits.'

        # ── Clinical Overrides for Extreme Anomalies ───────────────────────
        # ML models can fail on outliers outside their training distribution.
        # Hardcode biological extremes to instantly flag as critical.
        if (sys_bp < 70 or sys_bp > 200 or 
            dia_bp < 40 or dia_bp > 130 or 
            heart_rate < 30 or heart_rate > 160 or 
            oxygen < 85 or 
            temperature < 32.0 or temperature > 41.0):
            risk_level = 'CRITICAL'
            risk_score = 100
            message    = 'URGENT: Vitals are critically out of normal biological ranges. Seeking emergency medical care is strongly advised.'

        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'message':    message,
        }

    except Exception as e:
        return {'error': f'Prediction failed: {str(e)}'}

def send_credential_email(email, phone, password, user_name):
    subject = "Your Sahara Hospital Account Credentials"

    message = f"""
Hello {user_name},

Your account has been successfully created at Sahara Hospital.

Login Details:
Phone: {phone}
Temporary Password: {password}

Please log in and change your password as soon as possible.

Best regards,
Sahara Hospital Team
"""

    html_message = f"""
    <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; padding:25px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            
            <h2 style="color:#2c7be5; text-align:center;">Sahara Hospital</h2>
            <hr>

            <p>Dear <strong>{user_name}</strong>,</p>

            <p>Your account has been successfully created at <strong>Sahara Hospital</strong>.</p>

            <div style="background:#f8f9fa; padding:15px; border-radius:6px; margin:20px 0;">
                <h3 style="margin-top:0;">🔐 Login Credentials</h3>
                <p><strong>Phone:</strong> {phone}</p>
                <p><strong>Temporary Password:</strong> {password}</p>
            </div>

            <p style="color:#555;">
                For security reasons, please log in and <strong>change your password immediately</strong>.
            </p>

            <p>
                If you did not request this account, please contact the hospital administration.
            </p>

            <br>

            <p>
                Best regards,<br>
                <strong>Sahara Hospital Team</strong>
            </p>

            <hr>

            <p style="font-size:12px; color:#888; text-align:center;">
                This is an automated message. Please do not reply to this email.
            </p>

        </div>
    </div>
    """

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message
        )
        print(f"[EMAIL SENT] To {email}")
    except Exception as e:
        print(f"[EMAIL ERROR] {str(e)}")
def dict_fetch_all(cursor):
    """Return all rows from a cursor as a list of dicts"""
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]

def dict_fetch_one(cursor):
    """Return one row from a cursor as a dict"""
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    if row:
        return dict(zip(columns, row))
    return None

def calculate_health_score(vitals):
    """
    Calculates a health score from 0-100 based on vital signs.
    Higher is better.
    """
    score = 100
    
    # Blood Pressure
    sys = vitals.get('blood_pressure_systolic')
    dia = vitals.get('blood_pressure_diastolic')
    if sys:
        sys = int(sys)
        if sys > 140 or sys < 90: score -= 15
        if sys > 160 or sys < 80: score -= 15
        if sys > 180: score -= 20
        
    if dia:
        dia = int(dia)
        if dia > 90 or dia < 60: score -= 10
        if dia > 100: score -= 10

    # Heart Rate
    hr = vitals.get('heart_rate')
    if hr:
        hr = int(hr)
        if hr > 100 or hr < 60: score -= 15
        if hr > 120 or hr < 50: score -= 15

    # Glucose
    gl = vitals.get('glucose_level')
    if gl:
        gl = float(gl)
        if gl > 140 or gl < 70: score -= 10
        if gl > 200: score -= 15

    # Oxygen
    ox = vitals.get('oxygen_saturation')
    if ox:
        ox = float(ox)
        if ox < 95: score -= 20
        if ox < 90: score -= 30

    return max(0, min(100, score))

class CheckVitalsView(APIView):
    """
    API to evaluate vitals dynamically without saving.
    Combines rule-based checks with the ML risk predictor pipeline.
    """
    def post(self, request):
        name  = request.data.get('name')
        phone = request.data.get('phone')

        # Extract vitals from request
        bp_sys     = request.data.get('blood_pressure_systolic')
        bp_dia     = request.data.get('blood_pressure_diastolic')
        heart_rate = request.data.get('heart_rate')
        glucose    = request.data.get('glucose_level')
        oxygen     = request.data.get('oxygen_saturation')

        if not name or not phone:
            return Response({"error": "Name and phone are required"}, status=status.HTTP_400_BAD_REQUEST)

        # ── Rule-based abnormality checks ─────────────────────────────────
        abnormal = False
        reasons  = []

        if bp_sys and (int(bp_sys) < 90 or int(bp_sys) > 120):
            abnormal = True
            reasons.append("Systolic BP out of range (Normal: 90-120)")
        if bp_dia and (int(bp_dia) < 60 or int(bp_dia) > 80):
            abnormal = True
            reasons.append("Diastolic BP out of range (Normal: 60-80)")
        if heart_rate and (int(heart_rate) < 60 or int(heart_rate) > 100):
            abnormal = True
            reasons.append("Heart rate out of range (Normal: 60-100)")
        if glucose and (float(glucose) < 70 or float(glucose) > 140):
            abnormal = True
            reasons.append("Glucose out of range (Normal: 70-140)")
        if oxygen and (float(oxygen) < 95):
            abnormal = True
            reasons.append("Oxygen saturation too low (Normal: 95+)")

        # ── Rule-based health score (0-100, higher = healthier) ───────────
        health_score = calculate_health_score(request.data)

        # ── ML-based risk prediction or Rule-based Fallback ───────────────
        def is_valid_number(v, min_val=0):
            try:
                return v is not None and v != '' and float(v) > min_val
            except ValueError:
                return False
        
        has_full_data = (
            is_valid_number(request.data.get('heart_rate')) and
            is_valid_number(request.data.get('blood_pressure_systolic')) and
            is_valid_number(request.data.get('blood_pressure_diastolic')) and
            is_valid_number(request.data.get('respiratory_rate')) and
            is_valid_number(request.data.get('temperature')) and
            is_valid_number(request.data.get('oxygen_saturation')) and
            is_valid_number(request.data.get('age')) and
            is_valid_number(request.data.get('weight')) and
            is_valid_number(request.data.get('height')) and
            is_valid_number(request.data.get('gender'), min_val=-1)  # gender is 0 or 1
        )

        if has_full_data:
            ml_result  = predict_vitals(request.data)
            risk_level = ml_result.get('risk_level', 'UNKNOWN')
            risk_score = ml_result.get('risk_score', None)
            ml_message = ml_result.get('message', '')
            ml_error   = ml_result.get('error')
            model_used = 'ML_RISK_PREDICTOR'
        else:
            # Partial vitals: Fallback to rule-based Health Score mapping
            ml_error = None
            model_used = 'RULE_BASED_FALLBACK'
            # Scale rule-based health_score (0=bad, 100=good) to ML risk_score (0=good, 100=bad)
            risk_score = max(0, 100 - health_score) if health_score is not None else 0
            
            if health_score is None:
                risk_level = 'UNKNOWN'
                ml_message = 'Insufficient data to calculate risk.'
            elif health_score >= 80:
                risk_level = 'LOW'
                ml_message = 'Vitals look generally healthy based on available partial data.'
            elif health_score >= 60:
                risk_level = 'MODERATE'
                ml_message = 'Partial vitals are slightly out of range. Please provide full vitals for a detailed prediction.'
            elif health_score >= 40:
                risk_level = 'HIGH'
                ml_message = 'Available vitals indicate elevated risk. Doctor attention recommended.'
            else:
                risk_level = 'CRITICAL'
                ml_message = 'Available vitals indicate critical risk. Immediate medical attention advised.'

        # ── Save vitals and prediction if requested by Dashboard ──────────
        patient_id = request.data.get('patient_id')
        if patient_id and not ml_error:
            try:
                temp_val = request.data.get('temperature')
                temp = float(temp_val) if temp_val else None
                with connection.cursor() as cursor:
                    # 1. Insert into health_data (fires naive database trigger)
                    safe_hr = heart_rate if heart_rate else None
                    safe_sys = bp_sys if bp_sys else None
                    safe_dia = bp_dia if bp_dia else None
                    safe_gluc = glucose if glucose else None
                    safe_oxy = oxygen if oxygen else None
                    
                    cursor.execute(sql_queries.ADD_VITALS, [
                        patient_id, safe_hr, safe_sys, safe_dia, temp, safe_gluc, safe_oxy
                    ])
                    record = dict_fetch_one(cursor)
                    if record:
                        # 2. Update prediction row replacing naive trigger with ML risk
                        cursor.execute("""
                            UPDATE predictions
                            SET score = %s, risk_level = %s, model_name = %s
                            WHERE health_id = %s
                        """, [risk_score, risk_level, model_used, record['health_id']])
            except Exception as e:
                print(f"[ML MODEL] Failed saving vitals/prediction to DB: {e}")

        # ── Fetch available doctors when vitals are abnormal ──────────────
        doctors = []
        if abnormal or risk_level in ('HIGH', 'CRITICAL'):
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT u.user_id as doctor_id,
                           COALESCE(u.first_name || ' ' || u.last_name, u.email) as full_name,
                           u.specialization, u.experience_years,
                           COALESCE(json_agg(
                                json_build_object(
                                    'availability_id', da.availability_id,
                                    'date', da.available_date,
                                    'start', da.slot_start,
                                    'end', da.slot_end
                                )
                            ) FILTER (
                                WHERE da.availability_id IS NOT NULL
                                AND (
                                    SELECT COUNT(*) FROM appointments a
                                    WHERE a.availability_id = da.availability_id
                                    AND a.status != 'CANCELLED'
                                ) < da.max_patients
                            ), '[]'::json) as available_slots
                    FROM users u
                    LEFT JOIN doctor_availability da ON u.user_id = da.doctor_id
                    WHERE u.role = 'DOCTOR'
                    GROUP BY u.user_id
                    LIMIT 3
                """)
                doctors = dict_fetch_all(cursor)

        # ── Build unified response ────────────────────────────────────────
        response_data = {
            # Rule-based fields (preserve backward compatibility)
            'abnormal':     abnormal,
            'health_score': health_score,
            'reasons':      reasons,
            'doctors':      doctors,
            # ML prediction fields
            'risk_level':   risk_level,
            'risk_score':   risk_score,
            'message':      ml_message if not ml_error else (
                "Attention Needed: Your vitals show some abnormalities." if abnormal
                else "Your vitals are within the normal range. Keep up the good work!"
            ),
            'recommendation': (
                "We recommend consulting a doctor immediately."
                if (abnormal or risk_level in ('HIGH', 'CRITICAL'))
                else "Continue your healthy lifestyle and stay hydrated."
            ),
        }

        # Surface any model errors as a non-blocking warning
        if ml_error:
            response_data['ml_warning'] = ml_error

        return Response(response_data)

class LatestVitalsView(APIView):
    """API to get latest vitals for all patients or a specific patient"""
    def get(self, request, patient_id=None):
        with connection.cursor() as cursor:
            if patient_id:
                cursor.execute(sql_queries.GET_PATIENT_LATEST_VITALS, [patient_id])
                data = dict_fetch_one(cursor)
                if not data:
                    return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                cursor.execute(sql_queries.GET_LATEST_VITALS)
                data = dict_fetch_all(cursor)
                # Add AI Insights for all patients
                for patient_vitals in data:
                    patient_vitals['health_score'] = calculate_health_score(patient_vitals)
            return Response(data)

class HighRiskPatientsView(APIView):
    """API to get high-risk patients above a min score"""
    def get(self, request):
        min_score = request.query_params.get('min_score', 70.0)
        with connection.cursor() as cursor:
            cursor.execute(sql_queries.GET_HIGH_RISK_PATIENTS, [min_score])
            data = dict_fetch_all(cursor)
            return Response(data)

class GetHighRiskPatientsView(APIView):
    def get(self, request):
        threshold = request.query_params.get('threshold', 70)
        with connection.cursor() as cursor:
            cursor.execute(sql_queries.GET_HIGH_RISK_PATIENTS, [threshold])
            patients = dict_fetch_all(cursor)
            
            # Add AI Insights
            for p in patients:
                # The score from DB might be different, let's unify with our AI score
                p['ai_health_score'] = calculate_health_score(p)
                
        return Response(patients)

class TriggerRemindersView(APIView):
    """API to trigger email reminders for upcoming appointments"""
    def post(self, request):
        with connection.cursor() as cursor:
            # Find appointments in the next 24 hours that haven't sent a reminder
            cursor.execute("""
                SELECT a.appointment_id, p.first_name, p.last_name, p.phone, u.email as patient_email, 
                       a.appointment_date, a.slot_start, d.email as doctor_email
                FROM appointments a
                JOIN patients p ON a.patient_id = p.patient_id
                JOIN users u ON p.phone = u.phone
                JOIN users d ON a.doctor_id = d.user_id
                WHERE a.appointment_date = CURRENT_DATE + INTERVAL '1 day'
                AND a.reminder_sent = FALSE
                AND a.status != 'CANCELLED'
            """)
            appointments = dict_fetch_all(cursor)
            
            sent_count = 0
            for appt in appointments:
                subject = "Reminder: Your Appointment at Sahara Hospital tomorrow"
                message = f"""
                Hello {appt['first_name']},
                
                This is a reminder for your appointment tomorrow, {appt['appointment_date']}, at {appt['slot_start']}.
                
                Please be on time.
                
                Best regards,
                Sahara Hospital Team
                """
                try:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [appt['patient_email']])
                    cursor.execute("UPDATE appointments SET reminder_sent = TRUE WHERE appointment_id = %s", [appt['appointment_id']])
                    sent_count += 1
                except Exception as e:
                    print(f"[REMINDER ERROR] {str(e)}")
                    
        return Response({"status": "success", "reminders_sent": sent_count})

class DoctorScheduleView(APIView):
    """API to get doctor schedule summary"""
    def get(self, request, doctor_id):
        with connection.cursor() as cursor:
            cursor.execute(sql_queries.GET_DOCTOR_SCHEDULE, [doctor_id])
            data = dict_fetch_all(cursor)
            return Response(data)

class AddDoctorAvailabilityView(APIView):
    """API to add availability for a doctor"""
    def post(self, request):
        doctor_id = request.data.get('doctor_id')
        available_date = request.data.get('date')
        slot_start = request.data.get('slot_start')
        slot_end = request.data.get('slot_end')
        max_patients = request.data.get('max_patients', 1)

        if not all([doctor_id, available_date, slot_start, slot_end]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        if slot_start >= slot_end:
            return Response({"error": "End time must be after start time."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with connection.cursor() as cursor:
                # Overlap check: (s1 < e2 AND e1 > s2)
                cursor.execute("""
                    SELECT 1 FROM doctor_availability 
                    WHERE doctor_id = %s 
                      AND available_date = %s 
                      AND (slot_start < %s AND slot_end > %s)
                """, [doctor_id, available_date, slot_end, slot_start])
                
                if cursor.fetchone():
                    return Response({"error": "This time slot overlaps with an existing availability."}, status=status.HTTP_400_BAD_REQUEST)

                cursor.execute(sql_queries.ADD_AVAILABILITY, [
                    doctor_id, available_date, slot_start, slot_end, max_patients
                ])
                result = dict_fetch_one(cursor)
                return Response({
                    "message": "Availability added successfully",
                    "availability_id": result['availability_id']
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class BookAppointmentView(APIView):
    """API to book an appointment and optionally generate user accounts"""
    @transaction.atomic
    def post(self, request):
        patient_id = request.data.get('patient_id')
        doctor_id = request.data.get('doctor_id')
        date = request.data.get('date')
        slot_start = request.data.get('slot_start')

        # If patient_id is not provided, we register the user
        if not patient_id:
            name = request.data.get('name')
            phone = request.data.get('phone')
            email = request.data.get('email')
            dob = request.data.get('dob', '1990-01-01')
            
            # Map gender inputs ('0'/'1' or case-insensitive strings) to DB constraints
            raw_gender = str(request.data.get('gender', 'OTHER')).upper()
            if raw_gender in ('0', 'FEMALE'):
                gender = 'FEMALE'
            elif raw_gender in ('1', 'MALE'):
                gender = 'MALE'
            else:
                gender = 'OTHER'

            if not name or not phone:
                return Response({"error": "Name and phone are required for new patients"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with connection.cursor() as cursor:
                    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                    hashed_pwd = make_password(temp_password)
                    names = name.split(' ', 1)
                    first_name = names[0]
                    last_name = names[1] if len(names) > 1 else ''

                    # Create User (or get existing by phone)
                    cursor.execute("""
                        INSERT INTO users (phone, first_name, last_name, password_hash, role)
                        VALUES (%s, %s, %s, %s, 'PATIENT')
                        ON CONFLICT (phone) DO UPDATE SET 
                            first_name=EXCLUDED.first_name,
                            last_name=EXCLUDED.last_name
                        RETURNING user_id
                    """, [phone, first_name, last_name, hashed_pwd])
                    user_id = dict_fetch_one(cursor)['user_id']

                    # Create Patient
                    cursor.execute("""
                        INSERT INTO patients (user_id, first_name, last_name, dob, gender, phone, primary_doctor_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (phone) DO UPDATE SET primary_doctor_id=EXCLUDED.primary_doctor_id
                        RETURNING patient_id
                    """, [user_id, first_name, last_name, dob, gender, phone, doctor_id])
                    patient_id = dict_fetch_one(cursor)['patient_id']

                    # Update email only if not already taken by another user
                    if email:
                        cursor.execute("""
                            UPDATE users SET email = %s 
                            WHERE user_id = %s 
                              AND NOT EXISTS (
                                SELECT 1 FROM users WHERE email = %s AND user_id != %s
                              )
                        """, [email, user_id, email, user_id])

                    # We will send credentials AFTER confirmed booking to avoid spamming if booking fails
            except Exception as e:
                return Response({"error": "Failed to create patient account: " + str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not all([patient_id, doctor_id, date, slot_start]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with connection.cursor() as cursor:
                # First, verify if the slot is actually available (Server side check)
                cursor.execute(sql_queries.BOOK_APPOINTMENT, [patient_id, doctor_id, date, slot_start])
                result = dict_fetch_one(cursor)
                
                # If we registered a new user, send the email and return password
                if not request.data.get('patient_id'):
                    if email:
                        try:
                            # Send email synchronously to ensure delivery
                            send_credential_email(email, phone, temp_password, first_name)
                            logger.info(f"Credential email sent to {email}")
                        except Exception as e:
                            logger.error(f"Failed to send email: {str(e)}")
                            # Don't fail the booking just because email failed
                
                return Response({
                    "message": "Appointment booked successfully", 
                    "appointment_id": result['appointment_id'],
                    "patient_id": patient_id,
                    "credentials": {
                        "phone": phone,
                        "password": temp_password
                    } if not request.data.get('patient_id') else None
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # If this fails, the @transaction.atomic will rollback the user creation too
            return Response({"error": "Booking failed: " + str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CreateBillingView(APIView):
    """API to create billing for an appointment"""
    def post(self, request):
        appointment_id = request.data.get('appointment_id')
        base_amount = request.data.get('base_amount', 100.0)
        tax_rate = request.data.get('tax_rate', 0.18)
        discount_rate = request.data.get('discount_rate', 0.0)

        if not appointment_id:
            return Response({"error": "Missing appointment_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with connection.cursor() as cursor:
                cursor.execute(sql_queries.CREATE_BILLING, [appointment_id, base_amount, tax_rate, discount_rate])
                result = dict_fetch_one(cursor)
                return Response({"message": "Billing created", "billing_id": result['billing_id']}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MonthlyRevenueView(APIView):
    """API to get monthly revenue summary"""
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(sql_queries.GET_MONTHLY_REVENUE)
            data = dict_fetch_all(cursor)
            return Response(data)

class AddPatientView(APIView):
    """API to register a new patient"""
    def post(self, request):
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        dob = request.data.get('dob')
        gender = request.data.get('gender')
        phone = request.data.get('phone')
        address = request.data.get('address')
        primary_doctor_id = request.data.get('primary_doctor_id') or 1  # Default to 1

        if not all([first_name, last_name, dob, gender, phone]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with connection.cursor() as cursor:
                cursor.execute(sql_queries.ADD_PATIENT, [
                    first_name, last_name, dob, gender, phone, address, primary_doctor_id
                ])
                result = dict_fetch_one(cursor)
                return Response({
                    "message": "Patient added successfully", 
                    "patient_id": result['patient_id']
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PatientsListView(APIView):
    """API to get list of all registered patients"""
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute(sql_queries.GET_ALL_PATIENTS)
                data = dict_fetch_all(cursor)
                return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AddVitalsView(APIView):
    """API to record new vitals for a patient"""
    def post(self, request):
        try:
            patient_id = request.data.get('patient_id')
            heart_rate = request.data.get('heart_rate')
            bp_sys = request.data.get('blood_pressure_systolic')
            bp_dia = request.data.get('blood_pressure_diastolic')
            temp = request.data.get('temperature')
            glucose = request.data.get('glucose_level')
            oxygen = request.data.get('oxygen_saturation')

            with connection.cursor() as cursor:
                cursor.execute(sql_queries.ADD_VITALS, [
                    patient_id, heart_rate, bp_sys, bp_dia, temp, glucose, oxygen
                ])
                result = dict_fetch_one(cursor)
                return Response({
                    "message": "Vitals recorded successfully", 
                    "health_id": result['health_id']
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password

class LoginView(APIView):
    """API for user login using raw SQL users table"""
    def post(self, request):
        phone = request.data.get('phone')
        password = request.data.get('password')

        if not phone or not password:
            return Response({"error": "Phone and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT user_id, password_hash, role FROM users WHERE phone = %s", [phone])
                user = dict_fetch_one(cursor)

                if user and check_password(password, user['password_hash']):
                    refresh = RefreshToken()
                    refresh['user_id'] = user['user_id']
                    refresh['role'] = user['role']
                    
                    return Response({
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                        "role": user['role'],
                        "user_id": user['user_id']
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Invalid phone or password"}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientDashboardView(APIView):
    """API for Patient Dashboard data"""
    def get(self, request, user_id):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM patients WHERE user_id = %s", [user_id])
                patient = dict_fetch_one(cursor)
                if not patient:
                    return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
                
                patient_id = patient['patient_id']

                # Assigned Doctor with fallback to latest appointment
                cursor.execute("""
                    SELECT COALESCE(u.first_name || ' ' || u.last_name, u.email) as full_name, 
                           u.specialization, u.phone 
                    FROM users u 
                    WHERE u.user_id = %s
                """, [patient['primary_doctor_id']])
                assigned_doctor = dict_fetch_one(cursor)

                if not assigned_doctor:
                    # Fallback: Get the doctor from the latest appointment
                    cursor.execute("""
                        SELECT COALESCE(u.first_name || ' ' || u.last_name, u.email) as full_name, 
                               u.specialization, u.phone
                        FROM appointments a
                        JOIN users u ON a.doctor_id = u.user_id
                        WHERE a.patient_id = %s
                        ORDER BY a.scheduled_at DESC
                        LIMIT 1
                    """, [patient_id])
                    assigned_doctor = dict_fetch_one(cursor)

                cursor.execute("""
                    SELECT a.appointment_id, a.scheduled_at, a.status, a.reason, 
                           COALESCE(u.first_name || ' ' || u.last_name, u.email) as doctor_name
                    FROM appointments a
                    JOIN users u ON a.doctor_id = u.user_id
                    WHERE a.patient_id = %s
                    ORDER BY a.scheduled_at DESC
                """, [patient_id])
                appointments = dict_fetch_all(cursor)

                cursor.execute("""
                    SELECT b.billing_id, b.base_amount, b.tax_amount, b.discount_amount, b.total_amount, b.status, b.billed_at, a.scheduled_at
                    FROM billing b
                    JOIN appointments a ON b.appointment_id = a.appointment_id
                    WHERE b.patient_id = %s
                    ORDER BY b.billed_at DESC
                """, [patient_id])
                billing = dict_fetch_all(cursor)

                # Fetch invoices for each billing record
                for bill in billing:
                    cursor.execute("""
                        SELECT description, quantity, unit_price, line_total
                        FROM invoices
                        WHERE billing_id = %s
                        ORDER BY line_no ASC
                    """, [bill['billing_id']])
                    bill['invoices'] = dict_fetch_all(cursor)

                cursor.execute("""
                    SELECT recorded_at, heart_rate, blood_pressure_systolic as bp_sys, 
                           blood_pressure_diastolic as bp_dia, temperature, glucose_level, oxygen_saturation
                    FROM health_data
                    WHERE patient_id = %s
                    ORDER BY recorded_at DESC
                """, [patient_id])
                vitals = dict_fetch_all(cursor)

                # Health Score from predictions
                cursor.execute("""
                    SELECT score, risk_level, generated_at
                    FROM predictions
                    WHERE patient_id = %s
                    ORDER BY generated_at DESC
                    LIMIT 1
                """, [patient_id])
                health_score = dict_fetch_one(cursor)

                # Previous score for trend
                cursor.execute("""
                    SELECT score FROM predictions 
                    WHERE patient_id = %s
                    ORDER BY generated_at DESC
                    LIMIT 1 OFFSET 1
                """, [patient_id])
                prev_score = dict_fetch_one(cursor)

                # Medications
                cursor.execute("""
                    SELECT medication_id, name, dosage, frequency, instructions, is_active
                    FROM medications
                    WHERE patient_id = %s AND is_active = TRUE
                    ORDER BY created_at DESC
                """, [patient_id])
                medications = dict_fetch_all(cursor)

                # Recent Symptom Logs
                cursor.execute("""
                    SELECT log_id, mood, pain_level, notes, logged_at
                    FROM symptom_logs
                    WHERE patient_id = %s
                    ORDER BY logged_at DESC
                    LIMIT 10
                """, [patient_id])
                symptom_logs = dict_fetch_all(cursor)
                # Lab Reports
                cursor.execute("""
                    SELECT report_id, title, file_path, uploaded_at,
                           COALESCE(u.first_name || ' ' || u.last_name, u.email) as doctor_name
                    FROM lab_reports r
                    LEFT JOIN users u ON r.doctor_id = u.user_id
                    WHERE r.patient_id = %s
                    ORDER BY r.uploaded_at DESC
                """, [patient_id])
                lab_reports = dict_fetch_all(cursor)
                for report in lab_reports:
                    report['file_url'] = f"{settings.MEDIA_URL}{report['file_path']}"

                return Response({
                    "profile": patient,
                    "assigned_doctor": assigned_doctor,
                    "appointments": appointments,
                    "billing": billing,
                    "vitals_history": vitals,
                    "health_score": health_score,
                    "prev_score": prev_score,
                    "medications": medications,
                    "symptom_logs": symptom_logs,
                    "lab_reports": lab_reports
                })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AddSymptomLogView(APIView):
    """API to add a new symptom/mood log"""
    def post(self, request, patient_id):
        try:
            mood = request.data.get('mood')
            pain_level = request.data.get('pain_level')
            notes = request.data.get('notes')

            if not mood or pain_level is None:
                return Response({"error": "Mood and pain level are required"}, status=status.HTTP_400_BAD_REQUEST)

            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO symptom_logs (patient_id, mood, pain_level, notes)
                    VALUES (%s, %s, %s, %s)
                    RETURNING log_id
                """, [patient_id, mood, pain_level, notes])
                
                return Response({"message": "Log added successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MedicationManagementView(APIView):
    """API to manage patient medications"""
    def post(self, request, patient_id):
        try:
            name = request.data.get('name')
            dosage = request.data.get('dosage')
            frequency = request.data.get('frequency')
            instructions = request.data.get('instructions')

            if not name:
                return Response({"error": "Medication name is required"}, status=status.HTTP_400_BAD_REQUEST)

            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO medications (patient_id, name, dosage, frequency, instructions)
                    VALUES (%s, %s, %s, %s, %s)
                """, [patient_id, name, dosage, frequency, instructions])
                
                return Response({"message": "Medication added successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, medication_id):
        # Soft delete by setting is_active = FALSE
        try:
            with connection.cursor() as cursor:
                cursor.execute("UPDATE medications SET is_active = FALSE WHERE medication_id = %s", [medication_id])
                return Response({"message": "Medication removed"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdatePatientProfileView(APIView):
    """API to update patient profile fields (phone, address)"""
    def post(self, request, patient_id):
        phone = request.data.get('phone')
        address = request.data.get('address')

        updates = []
        params = []
        if phone is not None:
            updates.append("phone = %s")
            params.append(phone)
        if address is not None:
            updates.append("address = %s")
            params.append(address)

        if not updates:
            return Response({"error": "No fields to update"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            params.append(patient_id)
            with connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE patients SET {', '.join(updates)} WHERE patient_id = %s RETURNING patient_id",
                    params
                )
                result = dict_fetch_one(cursor)
                if not result:
                    return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
                return Response({"message": "Profile updated successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PatientDetailForDoctorView(APIView):
    """Full patient detail for doctor's patient detail view"""
    def get(self, request, patient_id):
        try:
            with connection.cursor() as cursor:
                # 1. Patient demographics
                cursor.execute("""
                    SELECT p.patient_id, p.first_name, p.last_name, p.dob, p.gender,
                           p.phone, p.address, p.created_at, p.ward,
                           COALESCE(u.first_name || ' ' || u.last_name, u.email) as primary_doctor_name,
                           u.specialization as primary_doctor_specialization
                    FROM patients p
                    LEFT JOIN users u ON p.primary_doctor_id = u.user_id
                    WHERE p.patient_id = %s
                """, [patient_id])
                patient = dict_fetch_one(cursor)
                if not patient:
                    return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

                # 2. Full vitals history (last 20)
                cursor.execute("""
                    SELECT health_id, recorded_at, heart_rate,
                           blood_pressure_systolic, blood_pressure_diastolic,
                           temperature, glucose_level, oxygen_saturation
                    FROM health_data
                    WHERE patient_id = %s
                    ORDER BY recorded_at DESC
                    LIMIT 20
                """, [patient_id])
                vitals_history = dict_fetch_all(cursor)

                # 3. Latest vitals
                latest_vitals = vitals_history[0] if vitals_history else None

                # 4. Health score history
                cursor.execute("""
                    SELECT prediction_id, score, risk_level, generated_at
                    FROM predictions
                    WHERE patient_id = %s
                    ORDER BY generated_at DESC
                    LIMIT 10
                """, [patient_id])
                predictions = dict_fetch_all(cursor)

                # 5. Appointment history
                cursor.execute("""
                    SELECT a.appointment_id, a.scheduled_at, a.status, a.reason,
                           COALESCE(u.first_name || ' ' || u.last_name, u.email) as doctor_name
                    FROM appointments a
                    JOIN users u ON a.doctor_id = u.user_id
                    WHERE a.patient_id = %s
                    ORDER BY a.scheduled_at DESC
                """, [patient_id])
                appointments = dict_fetch_all(cursor)

                # 6. Billing summary
                cursor.execute("""
                    SELECT b.billing_id, b.total_amount, b.status, b.billed_at
                    FROM billing b
                    WHERE b.patient_id = %s
                    ORDER BY b.billed_at DESC
                    LIMIT 5
                """, [patient_id])
                billing = dict_fetch_all(cursor)

                return Response({
                    "patient": patient,
                    "latest_vitals": latest_vitals,
                    "vitals_history": vitals_history,
                    "predictions": predictions,
                    "appointments": appointments,
                    "billing": billing
                })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DoctorDashboardView(APIView):
    """API for redesigned Doctor Dashboard data"""
    def get(self, request, user_id):
        try:
            with connection.cursor() as cursor:
                # 1. Doctor Profile
                cursor.execute("""
                    SELECT first_name || ' ' || last_name as full_name, specialization 
                    FROM users WHERE user_id = %s AND role = 'DOCTOR'
                """, [user_id])
                doctor_profile = dict_fetch_one(cursor)
                if not doctor_profile:
                    return Response({"error": "Doctor not found"}, status=status.HTTP_404_NOT_FOUND)

                # 2. Overview Metrics
                # Active Patients (last 30 days)
                cursor.execute("""
                    SELECT COUNT(DISTINCT patient_id) as count 
                    FROM appointments 
                    WHERE doctor_id = %s AND scheduled_at >= NOW() - INTERVAL '30 days'
                """, [user_id])
                active_patients = dict_fetch_one(cursor)['count']

                # High Risk Patients (risk > 70, last 24h)
                cursor.execute("""
                    SELECT COUNT(DISTINCT patient_id) as count 
                    FROM predictions 
                    WHERE score > 70 AND generated_at >= NOW() - INTERVAL '24 hours'
                """, [])
                high_risk_count = dict_fetch_one(cursor)['count']

                # Open Alerts (unacknowledged high/critical)
                cursor.execute("""
                    SELECT COUNT(*) as count FROM predictions 
                    WHERE score >= 70 AND acknowledged = FALSE
                """, [])
                open_alerts_count = dict_fetch_one(cursor)['count']

                # 3. Critical Alerts (Risk > 100)
                cursor.execute("""
                    SELECT 
                        pr.prediction_id,
                        p.patient_id, p.first_name || ' ' || p.last_name as name, p.ward,
                        pr.score as risk_score,
                        hd.heart_rate, hd.blood_pressure_systolic as bp_sys, 
                        hd.blood_pressure_diastolic as bp_dia, hd.oxygen_saturation as spo2,
                        hd.symptoms,
                        (SELECT MIN(scheduled_at) FROM appointments WHERE patient_id = p.patient_id AND scheduled_at >= NOW()) as next_appointment
                    FROM predictions pr
                    JOIN patients p ON pr.patient_id = p.patient_id
                    LEFT JOIN health_data hd ON pr.health_id = hd.health_id
                    WHERE pr.score > 100 AND pr.acknowledged = FALSE
                    ORDER BY pr.score DESC
                """)
                critical_alerts = dict_fetch_all(cursor)

                # 4. High Priority Alerts (70-100)
                cursor.execute("""
                    SELECT 
                        pr.prediction_id,
                        p.patient_id, p.first_name || ' ' || p.last_name as name,
                        pr.score as risk_score,
                        'Declining trend' as trend_message
                    FROM predictions pr
                    JOIN patients p ON pr.patient_id = p.patient_id
                    WHERE pr.score BETWEEN 70 AND 100 AND pr.acknowledged = FALSE
                    ORDER BY pr.score DESC
                """)
                high_priority_alerts = dict_fetch_all(cursor)

                # 5. Today's Schedule
                cursor.execute("""
                    SELECT 
                        a.appointment_id, a.scheduled_at, a.status, a.reason, 
                        p.first_name || ' ' || p.last_name as patient_name, p.patient_id
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.patient_id
                    WHERE a.doctor_id = %s AND a.scheduled_at >= CURRENT_DATE AND a.scheduled_at < CURRENT_DATE + 1
                    ORDER BY a.scheduled_at ASC
                """, [user_id])
                today_schedule = dict_fetch_all(cursor)

                # 6. All Patients (for Patients tab)
                cursor.execute("""
                    SELECT DISTINCT ON (p.patient_id)
                        p.patient_id, p.first_name, p.last_name, p.gender, p.dob, p.phone, p.address, p.created_at,
                        hd.recorded_at, hd.heart_rate, hd.blood_pressure_systolic, hd.blood_pressure_diastolic,
                        hd.temperature, hd.glucose_level, hd.oxygen_saturation,
                        (SELECT score FROM predictions WHERE patient_id = p.patient_id ORDER BY generated_at DESC LIMIT 1) as health_score
                    FROM patients p
                    LEFT JOIN health_data hd ON p.patient_id = hd.patient_id
                    ORDER BY p.patient_id, hd.recorded_at DESC;
                """)
                all_patients = dict_fetch_all(cursor)

                # 7. All Appointments (for Appointments tab)
                cursor.execute("""
                    SELECT 
                        a.appointment_id, a.scheduled_at, a.status, a.reason,
                        p.first_name, p.last_name, p.patient_id
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.patient_id
                    WHERE a.doctor_id = %s
                    ORDER BY a.scheduled_at DESC
                """, [user_id])
                all_appointments = dict_fetch_all(cursor)
                
                return Response({
                    "doctor": doctor_profile,
                    "metrics": {
                        "active_patients": active_patients,
                        "high_risk": high_risk_count,
                        "open_alerts": open_alerts_count
                    },
                    "alerts": {
                        "critical": critical_alerts,
                        "high_priority": high_priority_alerts
                    },
                    "today_schedule": today_schedule,
                    "patients": all_patients,
                    "appointments": all_appointments
                })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AcknowledgeAlertView(APIView):
    """API to acknowledge clinical alerts"""
    def patch(self, request, prediction_id):
        try:
            with connection.cursor() as cursor:
                cursor.execute("UPDATE predictions SET acknowledged = TRUE WHERE prediction_id = %s", [prediction_id])
                return Response({"message": "Alert acknowledged successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DischargePatientView(APIView):
    """API to discharge a patient: marks appointment COMPLETED + auto-generates billing"""
    @transaction.atomic
    def post(self, request, patient_id):
        doctor_id        = request.data.get('doctor_id')
        consultation_fee = float(request.data.get('consultation_fee', 500.00))
        tax_rate         = float(request.data.get('tax_rate', 0.18))
        discount_rate    = float(request.data.get('discount_rate', 0.0))
        notes            = request.data.get('notes', '')
        line_items       = request.data.get('line_items', [])  # [{description, quantity, unit_price}]

        if not doctor_id:
            return Response({"error": "doctor_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with connection.cursor() as cursor:
                # Step 1: Call the stored function — creates/completes appointment + billing header
                cursor.execute(sql_queries.DISCHARGE_PATIENT, [
                    patient_id, doctor_id,
                    consultation_fee, tax_rate, discount_rate,
                    notes
                ])
                result = dict_fetch_one(cursor)
                if not result:
                    return Response({"error": "Discharge failed — no result returned"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                billing_id     = result['billing_id']
                appointment_id = result['appointment_id']
                total_amount   = float(result['total_amount'])

                # Step 2: Insert invoice line items
                line_no = 1
                for item in line_items:
                    desc       = item.get('description', 'Service')
                    quantity   = float(item.get('quantity', 1))
                    unit_price = float(item.get('unit_price', 0))
                    line_total = round(quantity * unit_price, 2)

                    cursor.execute("""
                        INSERT INTO invoices (billing_id, line_no, description, quantity, unit_price, line_total)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, [billing_id, line_no, desc, quantity, unit_price, line_total])

                    # Add the line item total to billing base + recompute total via trigger
                    cursor.execute("""
                        UPDATE billing
                        SET base_amount  = base_amount  + %s,
                            tax_amount   = ROUND((base_amount + %s) * %s, 2),
                            total_amount = ROUND((base_amount + %s) * (1 + %s) - discount_amount, 2)
                        WHERE billing_id = %s
                    """, [line_total, line_total, tax_rate, line_total, tax_rate, billing_id])

                    line_no += 1

                # Fetch the final total after all line items
                cursor.execute("SELECT total_amount FROM billing WHERE billing_id = %s", [billing_id])
                final = dict_fetch_one(cursor)
                final_total = float(final['total_amount']) if final else total_amount

            return Response({
                "message": "Patient discharged successfully",
                "appointment_id": appointment_id,
                "billing_id": billing_id,
                "total_amount": final_total,
                "invoice_count": len(line_items)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

import os
from django.core.files.storage import FileSystemStorage

class LabReportsView(APIView):
    """API to manage patient lab reports"""
    def get(self, request, patient_id):
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT r.report_id, r.patient_id, r.title, r.file_path, r.uploaded_at,
                           COALESCE(u.first_name || ' ' || u.last_name, u.email) as doctor_name
                    FROM lab_reports r
                    LEFT JOIN users u ON r.doctor_id = u.user_id
                    WHERE r.patient_id = %s
                    ORDER BY r.uploaded_at DESC
                """, [patient_id])
                reports = dict_fetch_all(cursor)
                
                # Prepend media URL for easy access from frontend
                for report in reports:
                    report['file_url'] = f"{settings.MEDIA_URL}{report['file_path']}"
                
                return Response(reports)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, patient_id):
        title = request.data.get('title')
        file_obj = request.FILES.get('file')
        doctor_id = request.data.get('doctor_id') # Optional

        if not title or not file_obj:
            return Response({"error": "Title and file are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # First write to filesystem
            fs = FileSystemStorage()
            filename = fs.save(f"lab_reports/patient_{patient_id}_{file_obj.name}", file_obj)
            
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO lab_reports (patient_id, doctor_id, title, file_path)
                    VALUES (%s, %s, %s, %s)
                    RETURNING report_id
                """, [patient_id, doctor_id, title, filename])
                
                return Response({"message": "Report uploaded successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

