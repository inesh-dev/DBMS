import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
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

export default api;
