import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Calendar, DollarSign, LogOut, User, Users, Zap, FileText, Shield, TrendingUp, TrendingDown, Edit3, Save, X, Clock, ChevronDown, Phone, MessageSquare, ArrowDown, Plus, Smile, Meh, Frown, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VitalsCheckForm from '../components/VitalsCheckForm';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { updatePatientProfile, addSymptomLog, addMedication, deleteMedication } from '../api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function PatientDashboard() {
    const [data, setData] = useState(null);
    const [showVitalsForm, setShowVitalsForm] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ phone: '', address: '' });
    const [showAllAppointments, setShowAllAppointments] = useState(false);
    const [showMedicationModal, setShowMedicationModal] = useState(false);
    const [showSymptomModal, setShowSymptomModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [medicationForm, setMedicationForm] = useState({ name: '', dosage: '', frequency: '', instructions: '' });
    const [symptomForm, setSymptomForm] = useState({ mood: 'Good', pain_level: 0, notes: '' });
    const [uploadForm, setUploadForm] = useState({ title: '', file: null });
    const userId = localStorage.getItem('user_id');

    const fetchData = async () => {
        try {
            const res = await axios.get(`/api/dashboard/patient/${userId}/`);
            setData(res.data);
            setProfileForm({
                phone: res.data.profile?.phone || '',
                address: res.data.profile?.address || ''
            });
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        }
    };

    useEffect(() => {
        if (!userId) {
            window.location.href = '/login';
            return;
        }
        fetchData();
    }, [userId]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    const handleDownloadBill = (bill) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246);
        doc.text("VIBECARE HOSPITAL", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text("Official Medical Invoice", 105, 28, { align: "center" });
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Invoice ID: #INV-${bill.billing_id}`, 15, 45);
        doc.text(`Date: ${new Date(bill.billed_at).toLocaleDateString()}`, 15, 52);
        doc.text(`Patient: ${data.profile.first_name} ${data.profile.last_name}`, 15, 59);
        doc.setTextColor(bill.status === 'PAID' ? 34 : 234, bill.status === 'PAID' ? 197 : 179, bill.status === 'PAID' ? 94 : 8);
        doc.text(`Status: ${bill.status}`, 160, 45);
        doc.autoTable({
            startY: 70,
            head: [['Description', 'Amount']],
            body: [
                ['Consultation / Services Base', `$${bill.base_amount}`],
                ['Tax Amount', `$${bill.tax_amount}`],
                ['Discount Applied', `-$${bill.discount_amount}`],
            ],
            foot: [['Total Amount Due/Paid', `$${bill.total_amount}`]],
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
        });
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Thank you for choosing VibeCare. Wishing you good health.", 105, doc.lastAutoTable.finalY + 30, { align: "center" });
        doc.save(`Invoice_${bill.billing_id}.pdf`);
    };

    const handleDownloadPrescription = (appt) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129);
        doc.text("VIBECARE HOSPITAL", 105, 25, { align: "center" });
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text("Clinical Prescription & Summary", 105, 33, { align: "center" });
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.line(15, 40, 195, 40);
        doc.text(`Patient: ${data.profile.first_name} ${data.profile.last_name} (ID: #${data.profile.patient_id})`, 15, 50);
        doc.text(`Age/DOB: ${new Date(data.profile.dob).toLocaleDateString()}`, 15, 57);
        doc.text(`Doctor: Dr. ${appt.doctor_name}`, 15, 64);
        doc.text(`Date of Visit: ${new Date(appt.scheduled_at).toLocaleDateString()}`, 15, 71);
        doc.line(15, 78, 195, 78);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Consultation Notes / Reason", 15, 90);
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(appt.reason || "General Checkup", 15, 98, { maxWidth: 180 });
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Rx. Medications Required", 15, 120);
        const meds = data.medications || [];
        if (meds.length > 0) {
            const medBody = meds.map(m => [m.name, m.dosage, m.frequency, m.instructions || '']);
            doc.autoTable({
                startY: 125,
                head: [['Medicine', 'Dosage', 'Frequency', 'Instructions']],
                body: medBody,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
            });
        } else {
            doc.setFontSize(12);
            doc.setFont(undefined, 'italic');
            doc.text("No specific medications prescribed during this visit.", 15, 128);
        }
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        let finalY = meds.length > 0 ? doc.lastAutoTable.finalY + 40 : 160;
        doc.text("Doctor Signature: _______________________", 15, finalY);
        doc.save(`Prescription_${new Date(appt.scheduled_at).toISOString().split('T')[0]}.pdf`);
    };

    const handleUploadReport = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) {
            alert("Please select a file to upload.");
            return;
        }
        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('file', uploadForm.file);
        try {
            await axios.post(`/api/patients/${data.profile.patient_id}/lab-reports/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowUploadModal(false);
            setUploadForm({ title: '', file: null });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to upload report');
        }
    };

    const handleProfileSave = async () => {
        try {
            await updatePatientProfile(data.profile.patient_id, profileForm);
            setIsEditingProfile(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update profile');
        }
    };

    const handleAddMedication = async (e) => {
        e.preventDefault();
        try {
            await addMedication(data.profile.patient_id, medicationForm);
            setShowMedicationModal(false);
            setMedicationForm({ name: '', dosage: '', frequency: '', instructions: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add medication');
        }
    };

    const handleDeleteMedication = async (id) => {
        if (!confirm('Are you sure you want to remove this medication?')) return;
        try {
            await deleteMedication(id);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete medication');
        }
    };

    const handleAddSymptomLog = async (e) => {
        e.preventDefault();
        try {
            await addSymptomLog(data.profile.patient_id, symptomForm);
            setShowSymptomModal(false);
            setSymptomForm({ mood: 'Good', pain_level: 0, notes: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add log');
        }
    };

    if (!data) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280', fontWeight: 600, fontSize: 14 }}>Loading your dashboard…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );

    if (data.error) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Heart style={{ width: 48, height: 48, color: '#e5e7eb', marginBottom: 16 }} />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Just a moment</h2>
                <p style={{ color: '#9ca3af', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
                    {data.error === "Patient not found" ? "Your patient profile isn't fully set up yet. Please contact your doctor." : data.error}
                </p>
                <button onClick={handleLogout} style={{ marginTop: 24, color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Back to Login</button>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const vitalsChartData = (data.vitals_history || []).map(v => ({
        time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hr: v.heart_rate,
        sys: v.bp_sys,
        dia: v.bp_dia,
        glucose: v.glucose_level
    })).reverse();

    const healthScore = data.health_score;
    const prevScore = data.prev_score;
    const scoreTrend = healthScore && prevScore ? healthScore.score - prevScore.score : null;

    const upcomingAppointments = (data.appointments || []).filter(a => a.status === 'SCHEDULED');
    const pastAppointments = (data.appointments || []).filter(a => a.status !== 'SCHEDULED');
    const displayedPast = showAllAppointments ? pastAppointments : pastAppointments.slice(0, 5);

    const getScoreColor = (score) => {
        if (score >= 80) return '#ef4444';
        if (score >= 50) return '#f97316';
        return '#22c55e';
    };

    const getRiskConfig = (level) => {
        if (level === 'HIGH') return { label: 'High Risk', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' };
        if (level === 'MEDIUM') return { label: 'Moderate', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
        return { label: 'Low Risk', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };
    };

    const generateClinicalAssessment = (vitals) => {
        if (!vitals) return [];
        const notes = [];
        if (vitals.hr > 100) notes.push({ type: 'warning', text: `High Heart Rate: Your heart rate is ${vitals.hr} bpm. Try to rest and stay hydrated.` });
        else if (vitals.hr < 60 && vitals.hr > 0) notes.push({ type: 'warning', text: `Low Heart Rate: Your heart rate is ${vitals.hr} bpm. If you feel dizzy, please consult your doctor.` });
        else if (vitals.hr > 0) notes.push({ type: 'normal', text: `Your heart rate is healthy at ${vitals.hr} bpm.` });
        if (vitals.sys > 140) notes.push({ type: 'warning', text: `High Blood Pressure: Your systolic BP is ${vitals.sys} mmHg. Consider reducing salt intake.` });
        else if (vitals.sys < 90 && vitals.sys > 0) notes.push({ type: 'warning', text: `Low Blood Pressure: Your systolic BP is ${vitals.sys} mmHg. Drink plenty of fluids.` });
        else if (vitals.sys > 0) notes.push({ type: 'normal', text: `Your blood pressure is within a good range.` });
        if (vitals.oxygen_saturation < 95 && vitals.oxygen_saturation > 0) notes.push({ type: 'critical', text: `Low Oxygen: Your SpO₂ is ${vitals.oxygen_saturation}%. If you have trouble breathing, contact your doctor immediately.` });
        else if (vitals.oxygen_saturation > 0) notes.push({ type: 'normal', text: `Your oxygen levels are excellent at ${vitals.oxygen_saturation}%.` });
        if (vitals.temperature > 38) notes.push({ type: 'warning', text: `Fever Detected: Your temperature is ${vitals.temperature}°C. Rest and stay cool.` });
        if (vitals.glucose > 180) notes.push({ type: 'warning', text: `High Blood Sugar: Your glucose level is ${vitals.glucose} mg/dL. Monitor your diet.` });
        else if (vitals.glucose < 70 && vitals.glucose > 0) notes.push({ type: 'warning', text: `Low Blood Sugar: Your glucose level is ${vitals.glucose} mg/dL. Have a small snack.` });
        return notes;
    };

    const handleDownloadHealthReport = () => {
        const latestVitals = vitalsChartData[vitalsChartData.length - 1];
        const assessment = generateClinicalAssessment(latestVitals);
        const content = `
VIBECARE HOSPITAL - PERSONAL HEALTH REPORT
------------------------------------------
Date: ${new Date().toLocaleDateString()}
Patient: ${data.profile.first_name} ${data.profile.last_name}
Patient ID: #${data.profile.patient_id}

LATEST VITALS:
- Heart Rate: ${latestVitals?.hr || 'N/A'} bpm
- Blood Pressure: ${latestVitals?.sys || 'N/A'}/${latestVitals?.dia || 'N/A'} mmHg
- Oxygen Saturation: ${latestVitals?.oxygen_saturation || 'N/A'}%
- Glucose Level: ${latestVitals?.glucose || 'N/A'} mg/dL

AI HEALTH INSIGHTS:
${assessment.length > 0 ? assessment.map(a => `- [${a.type.toUpperCase()}] ${a.text}`).join('\n') : 'No specific insights at this time.'}

HEALTH SCORE: ${Math.round(healthScore?.score || 0)}/100 (${healthScore?.risk_level || 'N/A'})

DISCLAIMER: This report is for informational purposes only. Please consult your assigned doctor for official medical advice.
`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health_report_${data.profile.patient_id}.txt`;
        a.click();
    };

    // ─── Style tokens ────────────────────────────────────────────────────────────
    const card = {
        background: '#ffffff',
        border: '1px solid #f0f0f0',
        borderRadius: 20,
        padding: '28px 32px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
    };
    const label = { fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' };
    const btnPrimary = {
        background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 12,
        padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 2px 8px rgba(37,99,235,0.25)', transition: 'all 0.15s',
    };
    const btnGhost = {
        background: '#f8fafc', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
    };
    const inputStyle = {
        width: '100%', background: '#f9fafb', border: '1.5px solid #e5e7eb',
        borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#111827',
        outline: 'none', transition: 'border 0.15s', boxSizing: 'border-box',
    };

    const riskConfig = getRiskConfig(healthScore?.risk_level);
    const scoreColor = getScoreColor(healthScore?.score || 0);
    const latestVitals = vitalsChartData[vitalsChartData.length - 1];
    const clinicalNotes = generateClinicalAssessment(latestVitals);

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f9fafb', fontFamily: "'Inter', -apple-system, sans-serif" }}>

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <aside style={{
                width: 280, minWidth: 280, background: '#ffffff', borderRight: '1px solid #f0f0f0',
                display: 'flex', flexDirection: 'column', padding: '28px 20px', overflowY: 'auto',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 8px' }}>
                    <div style={{ background: '#2563eb', width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart style={{ width: 18, height: 18, color: '#fff' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', letterSpacing: '-0.02em' }}>VibeCare</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Patient Portal</div>
                    </div>
                </div>

                {/* Nav */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: '#eff6ff', borderRadius: 12, color: '#2563eb', fontWeight: 700, fontSize: 14
                    }}>
                        <Activity style={{ width: 16, height: 16 }} /> Dashboard
                    </div>
                </div>

                {/* Profile card */}
                <div style={{ ...label, paddingLeft: 8, marginBottom: 12 }}>My Profile</div>
                <div style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 16, padding: '20px 16px', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '50%', background: '#dbeafe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 14, color: '#1d4ed8'
                        }}>
                            {data.profile.first_name?.[0]}{data.profile.last_name?.[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{data.profile.first_name} {data.profile.last_name}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>ID #{data.profile.patient_id}</div>
                        </div>
                    </div>
                    {isEditingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <div style={{ ...label, marginBottom: 6 }}>Phone</div>
                                <input style={inputStyle} type="text" value={profileForm.phone}
                                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                            </div>
                            <div>
                                <div style={{ ...label, marginBottom: 6 }}>Address</div>
                                <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={profileForm.address}
                                    onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleProfileSave} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', padding: '9px 0', fontSize: 12 }}>
                                    <Save style={{ width: 13, height: 13 }} /> Save
                                </button>
                                <button onClick={() => setIsEditingProfile(false)} style={{ ...btnGhost, flex: 1, justifyContent: 'center', padding: '9px 0', fontSize: 12 }}>
                                    <X style={{ width: 13, height: 13 }} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                                <span style={{ color: '#9ca3af' }}>Phone: </span>
                                <span style={{ fontWeight: 600, color: '#374151' }}>{data.profile.phone || 'Not set'}</span>
                            </div>
                            <button onClick={() => setIsEditingProfile(true)} style={{
                                width: '100%', background: 'none', border: '1.5px solid #e5e7eb',
                                borderRadius: 10, padding: '8px 0', color: '#2563eb', fontWeight: 700,
                                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                                <Edit3 style={{ width: 12, height: 12 }} /> Edit Profile
                            </button>
                        </div>
                    )}
                </div>

                {/* Doctor card */}
                {data.assigned_doctor && (
                    <div>
                        <div style={{ ...label, paddingLeft: 8, marginBottom: 12 }}>Primary Physician</div>
                        <div style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                            borderRadius: 16, padding: '20px 16px', color: '#fff',
                            boxShadow: '0 4px 20px rgba(37,99,235,0.25)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users style={{ width: 16, height: 16, color: '#fff' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13 }}>Dr. {data.assigned_doctor.full_name}</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{data.assigned_doctor.specialization || 'General Care'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <a href={`tel:${data.assigned_doctor.phone}`} style={{
                                    flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    color: '#fff', fontWeight: 700, fontSize: 11, textDecoration: 'none'
                                }}>
                                    <Phone style={{ width: 12, height: 12 }} /> Call
                                </a>
                                <button style={{
                                    flex: 1, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10,
                                    color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                }}>
                                    <MessageSquare style={{ width: 12, height: 12 }} /> Message
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1 }} />

                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444',
                    fontWeight: 700, fontSize: 13, borderRadius: 12, width: '100%',
                    transition: 'background 0.15s'
                }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    <LogOut style={{ width: 16, height: 16 }} /> Sign Out
                </button>
            </aside>

            {/* ── Main content ─────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <header style={{
                    background: '#ffffff', borderBottom: '1px solid #f0f0f0',
                    padding: '0 40px', height: 72, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexShrink: 0, zIndex: 30
                }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: 0 }}>Health Dashboard</h1>
                        <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, margin: 0 }}>Real-time wellness monitoring</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button onClick={handleDownloadHealthReport} style={btnGhost}>
                            <FileText style={{ width: 14, height: 14 }} /> Download Report
                        </button>
                        <button onClick={() => setShowVitalsForm(true)} style={btnPrimary}>
                            <Zap style={{ width: 14, height: 14 }} /> Analyze Vitals
                        </button>
                        <div style={{
                            width: 40, height: 40, background: '#eff6ff', border: '1px solid #dbeafe',
                            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User style={{ width: 18, height: 18, color: '#2563eb' }} />
                        </div>
                    </div>
                </header>

                {/* Scrollable body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>

                    {/* ── Row 1: Hero Stats ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 20 }}>

                        {/* Health Index — hero card */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div>
                                    <div style={label}>Health Index</div>
                                    <div style={{ marginTop: 4, fontSize: 11, color: '#9ca3af' }}>AI risk assessment</div>
                                </div>
                                <div style={{ background: '#eff6ff', borderRadius: 10, padding: 8 }}>
                                    <Shield style={{ width: 18, height: 18, color: '#2563eb' }} />
                                </div>
                            </div>
                            {healthScore ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 16 }}>
                                        <span style={{ fontSize: 72, fontWeight: 900, color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                            {Math.round(healthScore.score)}
                                        </span>
                                        <span style={{ fontSize: 18, color: '#d1d5db', fontWeight: 700, paddingBottom: 12 }}>/100</span>
                                        {scoreTrend !== null && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 14,
                                                color: scoreTrend <= 0 ? '#16a34a' : '#dc2626', fontSize: 12, fontWeight: 700
                                            }}>
                                                {scoreTrend <= 0 ? <TrendingDown style={{ width: 14, height: 14 }} /> : <TrendingUp style={{ width: 14, height: 14 }} />}
                                                {Math.abs(Math.round(scoreTrend))}%
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(healthScore.score, 100)}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                style={{ height: '100%', background: scoreColor, borderRadius: 99 }}
                                            />
                                        </div>
                                        <span style={{
                                            display: 'inline-flex', alignSelf: 'flex-start',
                                            padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                            background: riskConfig.bg, color: riskConfig.color, border: `1px solid ${riskConfig.border}`
                                        }}>
                                            {riskConfig.label}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: '#9ca3af', fontSize: 13 }}>No score available</p>
                            )}
                        </motion.div>

                        {/* Recent Billing */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={label}>Recent Billing</div>
                                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 8 }}>
                                    <DollarSign style={{ width: 16, height: 16, color: '#16a34a' }} />
                                </div>
                            </div>
                            {data.billing.length > 0 ? (
                                <>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', marginBottom: 12 }}>
                                        ${data.billing[0].total_amount}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Latest invoice</span>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                                            background: data.billing[0].status === 'PAID' ? '#f0fdf4' : '#fffbeb',
                                            color: data.billing[0].status === 'PAID' ? '#15803d' : '#a16207',
                                            border: `1px solid ${data.billing[0].status === 'PAID' ? '#bbf7d0' : '#fde68a'}`
                                        }}>
                                            {data.billing[0].status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 8 }}>{formatDate(data.billing[0].billed_at)}</div>
                                </>
                            ) : (
                                <p style={{ color: '#9ca3af', fontSize: 13 }}>No billing history</p>
                            )}
                        </motion.div>

                        {/* Upcoming */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ ...card, background: '#eff6ff', border: '1px solid #dbeafe' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ ...label, color: '#2563eb' }}>Next Appointment</div>
                                <div style={{ background: '#fff', borderRadius: 10, padding: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <Calendar style={{ width: 16, height: 16, color: '#2563eb' }} />
                                </div>
                            </div>
                            {upcomingAppointments.length > 0 ? (
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1e40af', marginBottom: 4, letterSpacing: '-0.02em' }}>
                                        {formatDate(upcomingAppointments[0].scheduled_at)}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, marginBottom: 12 }}>
                                        {new Date(upcomingAppointments[0].scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <span style={{
                                        background: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11,
                                        fontWeight: 700, color: '#374151', border: '1px solid #dbeafe'
                                    }}>
                                        Dr. {upcomingAppointments[0].doctor_name}
                                    </span>
                                </div>
                            ) : (
                                <p style={{ color: '#93c5fd', fontSize: 13, fontStyle: 'italic' }}>No visits scheduled</p>
                            )}
                        </motion.div>

                        {/* Treatment Summary */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div style={label}>Treatment</div>
                                <div style={{ background: '#faf5ff', borderRadius: 10, padding: 8 }}>
                                    <TrendingUp style={{ width: 16, height: 16, color: '#7c3aed' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>{data.medications?.length || 0}</div>
                                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginTop: 2 }}>MEDICATIONS</div>
                                </div>
                                <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>{data.symptom_logs?.length || 0}</div>
                                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginTop: 2 }}>LOGS</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Row 2: Vitals Chart ── */}
                    <div style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Vitals Trending</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>Latest biometric readings</p>
                            </div>
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                {[
                                    { color: '#3b82f6', label: 'Systolic BP' },
                                    { color: '#ef4444', label: 'Heart Rate' },
                                ].map(({ color, label: l }) => (
                                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 24, height: 3, background: color, borderRadius: 99 }} />
                                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {vitalsChartData.length > 0 ? (
                            <div style={{ height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={vitalsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradHr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradSys" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }}
                                            labelStyle={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}
                                        />
                                        <Area type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#gradHr)" name="HR (bpm)" dot={false} />
                                        <Area type="monotone" dataKey="sys" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradSys)" name="BP Sys" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div style={{
                                height: 320, background: '#f9fafb', borderRadius: 16,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                border: '2px dashed #e5e7eb'
                            }}>
                                <Activity style={{ width: 40, height: 40, color: '#e5e7eb', marginBottom: 12 }} />
                                <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>NO VITALS RECORDED YET</p>
                            </div>
                        )}
                    </div>

                    {/* ── Row 3: Clinical Findings + Care ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Clinical Findings */}
                        <div style={{ ...card, borderLeft: '3px solid #2563eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Shield style={{ width: 16, height: 16, color: '#2563eb' }} />
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Clinical Findings</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {clinicalNotes.length === 0 ? (
                                    <div style={{ background: '#f9fafb', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
                                        <p style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>Awaiting assessment data</p>
                                    </div>
                                ) : clinicalNotes.map((note, i) => {
                                    const cfg = note.type === 'critical'
                                        ? { bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', text: '#991b1b' }
                                        : note.type === 'warning'
                                        ? { bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', text: '#92400e' }
                                        : { bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', text: '#15803d' };
                                    return (
                                        <div key={i} style={{
                                            background: cfg.bg, border: `1px solid ${cfg.border}`,
                                            borderRadius: 12, padding: '12px 14px',
                                            display: 'flex', alignItems: 'flex-start', gap: 10
                                        }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, marginTop: 4, flexShrink: 0 }} />
                                            <p style={{ fontSize: 12, color: cfg.text, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>{note.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Personalized Care */}
                        <div style={{ ...card, borderLeft: '3px solid #16a34a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Zap style={{ width: 16, height: 16, color: '#16a34a' }} />
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Personalized Care</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div style={{ width: 38, height: 38, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                        <Activity style={{ width: 16, height: 16, color: '#2563eb' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 4 }}>Biometric Consistency</div>
                                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>Daily vitals improve AI risk prediction accuracy significantly.</p>
                                    </div>
                                </div>
                                <div style={{ background: '#faf5ff', border: '1px solid #ede9fe', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div style={{ width: 38, height: 38, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                        <Calendar style={{ width: 16, height: 16, color: '#7c3aed' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 4 }}>Next Consultant Review</div>
                                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                                            {upcomingAppointments.length > 0
                                                ? `Confirmed for ${formatDate(upcomingAppointments[0].scheduled_at)}.`
                                                : 'No pending consultant reviews.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Row 4: Wellness + Medications ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                        {/* Wellness */}
                        <div style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Today's Reflection</h3>
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Emotional wellness log</p>
                                </div>
                                <button onClick={() => setShowSymptomModal(true)} style={{
                                    width: 36, height: 36, background: '#f0f5ff', border: '1px solid #e0e7ff',
                                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#4f46e5'
                                }}>
                                    <Plus style={{ width: 16, height: 16 }} />
                                </button>
                            </div>
                            {data.symptom_logs?.length > 0 ? (
                                <div>
                                    <div style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 14, padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                            <div style={{ width: 40, height: 40, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {['Great','Good'].includes(data.symptom_logs[0].mood)
                                                    ? <Smile style={{ width: 20, height: 20, color: '#16a34a' }} />
                                                    : data.symptom_logs[0].mood === 'Neutral'
                                                    ? <Meh style={{ width: 20, height: 20, color: '#d97706' }} />
                                                    : <Frown style={{ width: 20, height: 20, color: '#dc2626' }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{data.symptom_logs[0].mood}</div>
                                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(data.symptom_logs[0].logged_at)}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Pain Level</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{data.symptom_logs[0].pain_level}/10</span>
                                            </div>
                                            <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${data.symptom_logs[0].pain_level * 10}%`, background: '#2563eb', borderRadius: 99 }} />
                                            </div>
                                        </div>
                                        {data.symptom_logs[0].notes && (
                                            <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                                                <p style={{ fontSize: 11, color: '#6b7280', margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>"{data.symptom_logs[0].notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px 0', background: '#f9fafb', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
                                    <Smile style={{ width: 36, height: 36, color: '#e5e7eb', margin: '0 auto 12px' }} />
                                    <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, margin: '0 0 16px' }}>No reflection logged today</p>
                                    <button onClick={() => setShowSymptomModal(true)} style={{
                                        background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10,
                                        padding: '8px 20px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                                    }}>
                                        Log Wellness
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Medications */}
                        <div style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Prescribed Regimen</h3>
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Active medications</p>
                                </div>
                                <button onClick={() => setShowMedicationModal(true)} style={{ ...btnGhost, fontSize: 12, padding: '8px 16px', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                                    <Plus style={{ width: 14, height: 14 }} /> Add Protocol
                                </button>
                            </div>
                            {data.medications?.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    {data.medications.map((med, i) => (
                                        <div key={i} style={{
                                            background: '#f9fafb', border: '1px solid #f0f0f0',
                                            borderRadius: 14, padding: '16px', position: 'relative',
                                            transition: 'border-color 0.15s'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#bbf7d0'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = '#f0f0f0'}
                                        >
                                            <button onClick={() => handleDeleteMedication(med.medication_id)} style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#d1d5db', padding: 4, borderRadius: 6,
                                                display: 'flex', alignItems: 'center'
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none'; }}
                                            >
                                                <Trash2 style={{ width: 13, height: 13 }} />
                                            </button>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                <div style={{ width: 34, height: 34, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Activity style={{ width: 14, height: 14, color: '#16a34a' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{med.name}</div>
                                                    <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>{med.dosage} · {med.frequency}</div>
                                                </div>
                                            </div>
                                            {med.instructions && (
                                                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                                    <FileText style={{ width: 11, height: 11, color: '#9ca3af', marginTop: 2, flexShrink: 0 }} />
                                                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{med.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '48px 0', background: '#f9fafb', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
                                    <Activity style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 12px' }} />
                                    <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, margin: 0 }}>No active protocols</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Visit History ── */}
                    <div style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Visit History</h3>
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{pastAppointments.length} past consultations</p>
                            </div>
                        </div>
                        {pastAppointments.length > 0 ? (
                            <>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            {['Date & Time','Consultant','Purpose','Status & Docs'].map(h => (
                                                <th key={h} style={{ ...label, padding: '0 16px 12px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedPast.map((appt, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{formatDate(appt.scheduled_at)}</div>
                                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                                        {new Date(appt.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                                    Dr. {appt.doctor_name || 'Medical Officer'}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280', maxWidth: 220 }}>
                                                    {appt.reason || 'Routine Screening'}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{
                                                            padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                                                            background: appt.status === 'COMPLETED' ? '#f0fdf4' : appt.status === 'CANCELLED' ? '#fef2f2' : '#fffbeb',
                                                            color: appt.status === 'COMPLETED' ? '#15803d' : appt.status === 'CANCELLED' ? '#dc2626' : '#a16207',
                                                        }}>
                                                            {appt.status}
                                                        </span>
                                                        {appt.status === 'COMPLETED' && (
                                                            <button onClick={() => handleDownloadPrescription(appt)} style={{
                                                                background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 8,
                                                                padding: '4px 12px', fontSize: 11, color: '#2563eb', fontWeight: 700,
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                                                            }}>
                                                                <FileText style={{ width: 11, height: 11 }} /> RX
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {pastAppointments.length > 5 && (
                                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                                        <button onClick={() => setShowAllAppointments(!showAllAppointments)} style={{
                                            background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10,
                                            padding: '10px 24px', fontSize: 12, color: '#2563eb', fontWeight: 700,
                                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8
                                        }}>
                                            <ChevronDown style={{ width: 14, height: 14, transform: showAllAppointments ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                            {showAllAppointments ? 'Collapse' : `View all ${pastAppointments.length} visits`}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '56px 0', background: '#f9fafb', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
                                <Calendar style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 12px' }} />
                                <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, margin: 0 }}>No past visits logged</p>
                            </div>
                        )}
                    </div>

                    {/* ── Financial Records ── */}
                    <div style={card}>
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Financial Records</h3>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Billing & invoices</p>
                        </div>
                        {data.billing.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        {['Billing Date','Total','Status','Invoice'].map(h => (
                                            <th key={h} style={{ ...label, padding: '0 16px 12px', textAlign: h === 'Invoice' ? 'right' : 'left' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.billing.map((bill, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                                            <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#374151' }}>{formatDate(bill.billed_at)}</td>
                                            <td style={{ padding: '14px 16px', fontSize: 18, fontWeight: 800, color: '#16a34a' }}>${bill.total_amount}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                                                    background: bill.status === 'PAID' ? '#f0fdf4' : '#fffbeb',
                                                    color: bill.status === 'PAID' ? '#15803d' : '#a16207',
                                                }}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <button onClick={() => handleDownloadBill(bill)} style={{
                                                    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
                                                    padding: '8px 16px', fontSize: 12, color: '#374151', fontWeight: 600,
                                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
                                                    transition: 'all 0.15s'
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2563eb'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                                >
                                                    <FileText style={{ width: 13, height: 13 }} /> Download Invoice
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '56px 0', background: '#f9fafb', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
                                <DollarSign style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 12px' }} />
                                <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, margin: 0 }}>No billing records found</p>
                            </div>
                        )}
                    </div>

                    {/* ── Clinical Documents ── */}
                    <div style={{ ...card, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Clinical Documents</h3>
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Lab reports & radiology</p>
                            </div>
                            <button onClick={() => setShowUploadModal(true)} style={btnPrimary}>
                                <Plus style={{ width: 14, height: 14 }} /> Upload Document
                            </button>
                        </div>
                        {data.lab_reports?.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                {data.lab_reports.map((report, i) => (
                                    <div key={i} style={{
                                        background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 16,
                                        padding: '20px', display: 'flex', flexDirection: 'column', transition: 'all 0.15s'
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#dbeafe'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div style={{ width: 44, height: 44, background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FileText style={{ width: 20, height: 20, color: '#2563eb' }} />
                                            </div>
                                            <span style={{ fontSize: 10, color: '#9ca3af', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
                                                {formatDate(report.uploaded_at)}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.title}</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 16 }}>
                                            {report.doctor_name ? `Verified by Dr. ${report.doctor_name}` : 'Patient Uploaded'}
                                        </div>
                                        <a href={`http://localhost:8000${report.file_url}`} target="_blank" rel="noopener noreferrer" style={{
                                            display: 'block', textAlign: 'center', background: '#fff',
                                            border: '1.5px solid #dbeafe', borderRadius: 10, padding: '9px',
                                            fontSize: 11, color: '#2563eb', fontWeight: 700, textDecoration: 'none',
                                            transition: 'background 0.15s', marginTop: 'auto'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                        >
                                            View Document
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '64px 0', background: '#f9fafb', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
                                <FileText style={{ width: 48, height: 48, color: '#e5e7eb', margin: '0 auto 12px' }} />
                                <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, margin: 0 }}>No clinical archives available</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Modals ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {showVitalsForm && (
                    <VitalsCheckForm
                        onClose={() => setShowVitalsForm(false)}
                        initialData={{
                            name: `${data.profile.first_name} ${data.profile.last_name}`,
                            phone: data.profile.phone,
                            email: data.profile.email || ''
                        }}
                    />
                )}

                {/* Medication Modal */}
                {showMedicationModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            style={{ background: '#fff', borderRadius: 24, padding: 36, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#16a34a', borderRadius: '24px 24px 0 0' }} />
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 8 }}><Plus style={{ width: 18, height: 18, color: '#16a34a' }} /></div>
                                Add Medication
                            </h2>
                            <form onSubmit={handleAddMedication} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <div style={{ ...label, marginBottom: 8 }}>Medication Name</div>
                                    <input required type="text" placeholder="e.g. Paracetamol" value={medicationForm.name}
                                        onChange={e => setMedicationForm({...medicationForm, name: e.target.value})} style={inputStyle} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <div style={{ ...label, marginBottom: 8 }}>Dosage</div>
                                        <input type="text" placeholder="500mg" value={medicationForm.dosage}
                                            onChange={e => setMedicationForm({...medicationForm, dosage: e.target.value})} style={inputStyle} />
                                    </div>
                                    <div>
                                        <div style={{ ...label, marginBottom: 8 }}>Frequency</div>
                                        <input type="text" placeholder="Twice daily" value={medicationForm.frequency}
                                            onChange={e => setMedicationForm({...medicationForm, frequency: e.target.value})} style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ ...label, marginBottom: 8 }}>Instructions</div>
                                    <textarea rows={3} placeholder="Take after meals…" value={medicationForm.instructions}
                                        onChange={e => setMedicationForm({...medicationForm, instructions: e.target.value})}
                                        style={{ ...inputStyle, resize: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                                    <button type="button" onClick={() => setShowMedicationModal(false)}
                                        style={{ flex: 1, background: 'none', border: 'none', color: '#9ca3af', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '13px' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" style={{ ...btnPrimary, flex: 2, justifyContent: 'center', padding: '13px', fontSize: 13 }}>
                                        Add Protocol
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Symptom Modal */}
                {showSymptomModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            style={{ background: '#fff', borderRadius: 24, padding: 36, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#4f46e5', borderRadius: '24px 24px 0 0' }} />
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: '#f0f5ff', borderRadius: 10, padding: 8 }}><Smile style={{ width: 18, height: 18, color: '#4f46e5' }} /></div>
                                Wellness Log
                            </h2>
                            <form onSubmit={handleAddSymptomLog} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <div style={{ ...label, marginBottom: 14 }}>Current Emotional State</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['Great','Good','Neutral','Bad','Awful'].map(m => (
                                            <button key={m} type="button" onClick={() => setSymptomForm({...symptomForm, mood: m})}
                                                style={{
                                                    flex: 1, padding: '12px 4px', borderRadius: 12, cursor: 'pointer',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                                    background: symptomForm.mood === m ? '#f0f5ff' : '#f9fafb',
                                                    border: `2px solid ${symptomForm.mood === m ? '#4f46e5' : 'transparent'}`,
                                                    color: symptomForm.mood === m ? '#4f46e5' : '#9ca3af',
                                                    transform: symptomForm.mood === m ? 'scale(1.05)' : 'scale(1)',
                                                    transition: 'all 0.15s'
                                                }}>
                                                {['Great','Good'].includes(m) ? <Smile style={{ width: 18, height: 18 }} />
                                                    : m === 'Neutral' ? <Meh style={{ width: 18, height: 18 }} />
                                                    : <Frown style={{ width: 18, height: 18 }} />}
                                                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}>{m.toUpperCase()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={label}>Pain Intensity</div>
                                        <span style={{
                                            fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                                            background: symptomForm.pain_level > 7 ? '#fef2f2' : symptomForm.pain_level > 3 ? '#fffbeb' : '#f0fdf4',
                                            color: symptomForm.pain_level > 7 ? '#dc2626' : symptomForm.pain_level > 3 ? '#d97706' : '#16a34a'
                                        }}>
                                            {symptomForm.pain_level} / 10
                                        </span>
                                    </div>
                                    <input type="range" min="0" max="10" step="1" value={symptomForm.pain_level}
                                        onChange={e => setSymptomForm({...symptomForm, pain_level: parseInt(e.target.value)})}
                                        style={{ width: '100%', accentColor: '#4f46e5' }} />
                                </div>
                                <div>
                                    <div style={{ ...label, marginBottom: 8 }}>Notes</div>
                                    <textarea rows={3} placeholder="How are you managing today?" value={symptomForm.notes}
                                        onChange={e => setSymptomForm({...symptomForm, notes: e.target.value})}
                                        style={{ ...inputStyle, resize: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" onClick={() => setShowSymptomModal(false)}
                                        style={{ flex: 1, background: 'none', border: 'none', color: '#9ca3af', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '13px' }}>
                                        Skip
                                    </button>
                                    <button type="submit" style={{ ...btnPrimary, flex: 2, justifyContent: 'center', padding: '13px', fontSize: 13, background: '#4f46e5', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' }}>
                                        Save Log
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            style={{ background: '#fff', borderRadius: 24, padding: 36, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#2563eb', borderRadius: '24px 24px 0 0' }} />
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: '#eff6ff', borderRadius: 10, padding: 8 }}><FileText style={{ width: 18, height: 18, color: '#2563eb' }} /></div>
                                Upload Document
                            </h2>
                            <form onSubmit={handleUploadReport} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <div style={{ ...label, marginBottom: 8 }}>Document Title</div>
                                    <input required type="text" placeholder="e.g. CBC Blood Analysis" value={uploadForm.title}
                                        onChange={e => setUploadForm({...uploadForm, title: e.target.value})} style={inputStyle} />
                                </div>
                                <div>
                                    <div style={{ ...label, marginBottom: 8 }}>Medical Document (PDF/IMG)</div>
                                    <div style={{ position: 'relative' }}>
                                        <input required type="file" onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                                        <div style={{
                                            background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: 14,
                                            padding: '28px 20px', textAlign: 'center'
                                        }}>
                                            <div style={{ width: 36, height: 36, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                                <Plus style={{ width: 16, height: 16, color: '#9ca3af' }} />
                                            </div>
                                            <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, margin: 0 }}>
                                                {uploadForm.file ? uploadForm.file.name : 'Select file from device'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                                    <button type="button" onClick={() => setShowUploadModal(false)}
                                        style={{ flex: 1, background: 'none', border: 'none', color: '#9ca3af', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '13px' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" style={{ ...btnPrimary, flex: 2, justifyContent: 'center', padding: '13px', fontSize: 13 }}>
                                        Upload to Vault
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PatientDashboard;