from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import string
import random
from django.contrib.auth.hashers import make_password
from . import sql_queries

def send_whatsapp_message(phone, msg):
    # Mock Twilio Implementation
    # from twilio.rest import Client
    # client = Client('ACCOUNT_SID', 'AUTH_TOKEN')
    # message = client.messages.create(body=msg, from_='whatsapp:+14155238886', to=f'whatsapp:{phone}')
    print(f"[WHATSAPP MOCK] To {phone}: {msg}")

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

class CheckVitalsView(APIView):
    """API to evaluate vitals dynamically without saving"""
    def post(self, request):
        name = request.data.get('name')
        phone = request.data.get('phone')
        
        # At least one vital should be present
        bp_sys = request.data.get('blood_pressure_systolic')
        bp_dia = request.data.get('blood_pressure_diastolic')
        heart_rate = request.data.get('heart_rate')
        glucose = request.data.get('glucose_level')
        oxygen = request.data.get('oxygen_saturation')

        if not name or not phone:
            return Response({"error": "Name and phone are required"}, status=status.HTTP_400_BAD_REQUEST)

        abnormal = False
        reasons = []

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

        if abnormal:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT u.user_id as doctor_id, u.email as pre_name, u.specialization, u.experience_years,
                           COALESCE(json_agg(
                               json_build_object(
                                   'availability_id', da.availability_id,
                                   'date', da.available_date,
                                   'start', da.slot_start,
                                   'end', da.slot_end
                               )
                           ) FILTER (WHERE da.availability_id IS NOT NULL), '[]') as available_slots
                    FROM users u
                    LEFT JOIN doctor_availability da ON u.user_id = da.doctor_id AND da.available_date >= CURRENT_DATE
                    WHERE u.role = 'DOCTOR'
                    GROUP BY u.user_id, u.email, u.specialization, u.experience_years
                """)
                doctors = dict_fetch_all(cursor)
                
                # Format name properly since email contains name usually in sample data
                for d in doctors:
                    d['name'] = "Dr. " + d['pre_name'].split('@')[0].replace('dr.', '').title()
                    d.pop('pre_name', None)
            
            return Response({
                "status": "OUT_OF_RANGE",
                "message": "Your vitals are out of the normal range. Please consult a doctor immediately.",
                "reasons": reasons,
                "doctors": doctors
            })
        else:
            return Response({
                "status": "NORMAL",
                "message": "Your vitals are within the normal range. Keep up the good work!"
            })

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
            return Response(data)

class HighRiskPatientsView(APIView):
    """API to get high-risk patients above a min score"""
    def get(self, request):
        min_score = request.query_params.get('min_score', 70.0)
        with connection.cursor() as cursor:
            cursor.execute(sql_queries.GET_HIGH_RISK_PATIENTS, [min_score])
            data = dict_fetch_all(cursor)
            return Response(data)

class DoctorScheduleView(APIView):
    """API to get doctor schedule summary"""
    def get(self, request, doctor_id):
        with connection.cursor() as cursor:
            cursor.execute(sql_queries.GET_DOCTOR_SCHEDULE, [doctor_id])
            data = dict_fetch_all(cursor)
            return Response(data)

class BookAppointmentView(APIView):
    """API to book an appointment and optionally generate user accounts"""
    def post(self, request):
        patient_id = request.data.get('patient_id')
        doctor_id = request.data.get('doctor_id')
        date = request.data.get('date')
        slot_start = request.data.get('slot_start')

        # If patient_id is not provided, we register the user
        if not patient_id:
            name = request.data.get('name')
            phone = request.data.get('phone')
            dob = request.data.get('dob', '1990-01-01')
            gender = request.data.get('gender', 'OTHER')

            if not name or not phone:
                return Response({"error": "Name and phone are required for new patients"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with connection.cursor() as cursor:
                    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                    hashed_pwd = make_password(temp_password)
                    names = name.split(' ', 1)
                    first_name = names[0]
                    last_name = names[1] if len(names) > 1 else ''

                    # Create User
                    cursor.execute("""
                        INSERT INTO users (phone, password_hash, role)
                        VALUES (%s, %s, 'PATIENT')
                        ON CONFLICT (phone) DO UPDATE SET password_hash=EXCLUDED.password_hash
                        RETURNING user_id
                    """, [phone, hashed_pwd])
                    user_id = dict_fetch_one(cursor)['user_id']

                    # Create Patient
                    cursor.execute("""
                        INSERT INTO patients (user_id, first_name, last_name, dob, gender, phone)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (phone) DO UPDATE SET user_id=EXCLUDED.user_id
                        RETURNING patient_id
                    """, [user_id, first_name, last_name, dob, gender, phone])
                    patient_id = dict_fetch_one(cursor)['patient_id']

                    # Send WhatsApp
                    send_whatsapp_message(phone, f"Hello {first_name}, your hospital account is created. Login with phone: {phone} and temp password: {temp_password}")
            except Exception as e:
                return Response({"error": "Failed to create patient account: " + str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not all([patient_id, doctor_id, date, slot_start]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with connection.cursor() as cursor:
                cursor.execute(sql_queries.BOOK_APPOINTMENT, [patient_id, doctor_id, date, slot_start])
                result = dict_fetch_one(cursor)
                return Response({
                    "message": "Appointment booked successfully", 
                    "appointment_id": result['appointment_id'],
                    "patient_id": patient_id
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

                cursor.execute("""
                    SELECT u.email as name, u.specialization, u.phone 
                    FROM users u WHERE u.user_id = %s
                """, [patient['primary_doctor_id']])
                assigned_doctor = dict_fetch_one(cursor)

                cursor.execute("""
                    SELECT a.appointment_id, a.scheduled_at, a.status, a.reason, u.email as doctor_name
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

                cursor.execute("""
                    SELECT recorded_at, heart_rate, blood_pressure_systolic as bp_sys, 
                           blood_pressure_diastolic as bp_dia, temperature, glucose_level, oxygen_saturation
                    FROM health_data
                    WHERE patient_id = %s
                    ORDER BY recorded_at DESC
                """, [patient_id])
                vitals = dict_fetch_all(cursor)

                return Response({
                    "profile": patient,
                    "assigned_doctor": assigned_doctor,
                    "appointments": appointments,
                    "billing": billing,
                    "vitals_history": vitals
                })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DoctorDashboardView(APIView):
    """API for Doctor Dashboard data"""
    def get(self, request, user_id):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE user_id = %s AND role = 'DOCTOR'", [user_id])
                if not dict_fetch_one(cursor):
                    return Response({"error": "Doctor not found"}, status=status.HTTP_404_NOT_FOUND)

                cursor.execute("""
                    SELECT patient_id, first_name, last_name, dob, gender, phone 
                    FROM patients WHERE primary_doctor_id = %s
                """, [user_id])
                patients = dict_fetch_all(cursor)

                cursor.execute("""
                    SELECT a.appointment_id, a.scheduled_at, a.status, a.reason, p.first_name, p.last_name, p.patient_id
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.patient_id
                    WHERE a.doctor_id = %s
                    ORDER BY a.scheduled_at ASC
                """, [user_id])
                appointments = dict_fetch_all(cursor)
                
                return Response({
                    "patients": patients,
                    "appointments": appointments
                })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
