import axios from 'axios';

const getBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) return '/api';

    // Ensure we don't double up on /api
    if (envUrl.endsWith('/api') || envUrl.endsWith('/api/')) {
        return envUrl;
    }

    // Append /api with correct slashes
    return envUrl.endsWith('/') ? `${envUrl}api` : `${envUrl}/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

export const getVitals = async (patientId = null) => {
    const url = patientId ? `/vitals/${patientId}/` : '/vitals/';
    const response = await api.get(url);
    return response.data;
};

export const checkVitals = async (data) => {
    const response = await api.post('/vitals/check/', data);
    return response.data;
};

export const getHighRiskPatients = async (minScore = 70.0) => {
    const response = await api.get(`/high-risk/?min_score=${minScore}`);
    return response.data;
};

export const getDoctorSchedule = async (doctorId) => {
    const response = await api.get(`/doctor-schedule/${doctorId}/`);
    return response.data;
};

export const getMonthlyRevenue = async () => {
    const response = await api.get('/revenue/');
    return response.data;
};

export const bookAppointment = async (appointmentData) => {
    const response = await api.post('/appointments/book/', appointmentData);
    return response.data;
};

export const addPatient = async (patientData) => {
    console.log("API: Adding patient...", patientData);
    const response = await api.post('/patients/add/', patientData);
    console.log("API: Add patient response:", response.data);
    return response.data;
};

export const getAllPatients = async () => {
    console.log("API: Fetching all patients...");
    const response = await api.get('/patients/');
    console.log("API: Fetch patients response:", response.data);
    return response.data;
};

export const addVitals = async (vitalsData) => {
    console.log("API: Recording vitals...", vitalsData);
    const response = await api.post('/vitals/add/', vitalsData);
    console.log("API: Record vitals response:", response.data);
    return response.data;
};

export const getDoctorDashboard = async (userId) => {
    const response = await api.get(`/dashboard/doctor/${userId}/`);
    return response.data;
};

export const addDoctorAvailability = async (data) => {
    const response = await api.post('/doctor-availability/add/', data);
    return response.data;
};

export const dischargePatient = async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/discharge/`, data);
    return response.data;
};

export const acknowledgeAlert = async (predictionId) => {
    const response = await api.patch(`/alerts/acknowledge/${predictionId}/`);
    return response.data;
};

export const getPatientDetail = async (patientId) => {
    const response = await api.get(`/patients/${patientId}/detail/`);
    return response.data;
};

export const updatePatientProfile = async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/profile/`, data);
    return response.data;
};

export const addSymptomLog = async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/symptoms/add/`, data);
    return response.data;
};

export const addMedication = async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/medications/`, data);
    return response.data;
};

export const deleteMedication = async (medicationId) => {
    const response = await api.delete(`/medications/${medicationId}/`);
    return response.data;
};

export const uploadLabReport = async (patientId, formData) => {
    const response = await api.post(`/patients/${patientId}/lab-reports/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const login = async (phone, password) => {
    const response = await api.post('/auth/login/', { phone, password });
    return response.data;
};

export const getPatientDashboard = async (userId) => {
    const response = await api.get(`/dashboard/patient/${userId}/`);
    return response.data;
};

export default api;
