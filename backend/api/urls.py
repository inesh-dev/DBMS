from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('dashboard/patient/<int:user_id>/', views.PatientDashboardView.as_view(), name='patient-dashboard'),
    path('dashboard/doctor/<int:user_id>/', views.DoctorDashboardView.as_view(), name='doctor-dashboard'),
    path('vitals/', views.LatestVitalsView.as_view(), name='latest-vitals'),
    path('vitals/check/', views.CheckVitalsView.as_view(), name='check-vitals'),
    path('vitals/add/', views.AddVitalsView.as_view(), name='add-vitals'),
    path('vitals/<int:patient_id>/', views.LatestVitalsView.as_view(), name='patient-vitals'),
    path('high-risk/', views.HighRiskPatientsView.as_view(), name='high-risk-patients'),
    path('doctor-schedule/<int:doctor_id>/', views.DoctorScheduleView.as_view(), name='doctor-schedule'),
    path('appointments/book/', views.BookAppointmentView.as_view(), name='book-appointment'),
    path('patients/', views.PatientsListView.as_view(), name='patients-list'),
    path('patients/add/', views.AddPatientView.as_view(), name='add-patient'),
    path('billing/create/', views.CreateBillingView.as_view(), name='create-billing'),
    path('revenue/', views.MonthlyRevenueView.as_view(), name='monthly-revenue'),
]
