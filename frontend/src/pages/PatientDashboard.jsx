import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Calendar, DollarSign, LogOut, User, Zap, FileText, Shield, TrendingUp, TrendingDown, Edit3, Save, X, Clock, ChevronDown, Phone, MessageSquare, ArrowDown, Plus, Smile, Meh, Frown, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VitalsCheckForm from '../components/VitalsCheckForm';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { updatePatientProfile, addSymptomLog, addMedication, deleteMedication } from '../api';

function PatientDashboard() {
    const [data, setData] = useState(null);
    const [showVitalsForm, setShowVitalsForm] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ phone: '', address: '' });
    const [showAllAppointments, setShowAllAppointments] = useState(false);
    const [showMedicationModal, setShowMedicationModal] = useState(false);
    const [showSymptomModal, setShowSymptomModal] = useState(false);
    const [medicationForm, setMedicationForm] = useState({ name: '', dosage: '', frequency: '', instructions: '' });
    const [symptomForm, setSymptomForm] = useState({ mood: 'Good', pain_level: 0, notes: '' });
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
        const content = `
VIBECARE HOSPITAL - INVOICE
---------------------------
Bill ID: ${bill.billing_id}
Date: ${new Date(bill.billed_at).toLocaleDateString()}
Patient: ${data.profile.first_name} ${data.profile.last_name}
Appointment Date: ${new Date(bill.scheduled_at).toLocaleDateString()}

DETAILS:
Base Amount: $${bill.base_amount}
Tax Amount: $${bill.tax_amount}
Discount: -$${bill.discount_amount}
---------------------------
TOTAL AMOUNT: $${bill.total_amount}
Status: ${bill.status}

Thank you for choosing VibeCare.
`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill_${bill.billing_id}.txt`;
        a.click();
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

    if (!data) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-blue-500">Loading...</div>;

    if (data.error) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-red-500 p-4 text-center">
                <Heart className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-2xl font-bold mb-2">Wait a moment</h2>
                <p className="text-gray-400 max-w-md">{data.error === "Patient not found" ? "It seems your patient profile is not yet fully set up. Please contact your doctor." : data.error}</p>
                <button onClick={handleLogout} className="mt-6 text-blue-400 hover:underline">Back to Login</button>
            </div>
        );
    }

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
        if (score >= 80) return '#ef4444'; // Higher risk score is worse
        if (score >= 50) return '#f59e0b';
        return '#22c55e';
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

    const getRiskLabel = (level) => {
        if (level === 'HIGH') return { text: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
        if (level === 'MEDIUM') return { text: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
        return { text: 'Low Risk', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-white font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#161b22] border-r border-gray-800 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-blue-500" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Patient Area
                    </span>
                </div>

                {/* Profile card in sidebar */}
                <div className="p-4 space-y-4 flex-1">
                    <div className="bg-[#1f2632] rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold">
                                {data.profile.first_name?.[0]}{data.profile.last_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{data.profile.first_name} {data.profile.last_name}</div>
                                <div className="text-xs text-gray-400">ID: #{data.profile.patient_id}</div>
                            </div>
                        </div>

                        {isEditingProfile ? (
                            <div className="space-y-2 mt-3 pt-3 border-t border-gray-700">
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase">Phone</label>
                                    <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mt-1" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase">Address</label>
                                    <textarea value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mt-1 resize-none" rows={2} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleProfileSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition-colors">
                                        <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition-colors">
                                        <X className="w-3 h-3" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 mt-3 pt-3 border-t border-gray-700">
                                <div className="text-xs"><span className="text-gray-400">Phone:</span> <span className="text-gray-200">{data.profile.phone || 'Not set'}</span></div>
                                <div className="text-xs"><span className="text-gray-400">Address:</span> <span className="text-gray-200">{data.profile.address || 'Not set'}</span></div>
                                <button onClick={() => setIsEditingProfile(true)} className="w-full text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 mt-2 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors">
                                    <Edit3 className="w-3 h-3" /> Edit Profile
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 text-blue-400 font-medium">
                        <Activity className="w-5 h-5" /> Dashboard
                    </div>

                    {/* Assigned Doctor Card */}
                    {data.assigned_doctor && (
                        <div className="bg-[#1f2632] rounded-xl p-4 border border-gray-800 space-y-3">
                            <h4 className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Assigned Doctor</h4>
                            <div className="flex flex-col gap-1">
                                <div className="text-sm font-bold text-gray-100 italic">Dr. {data.assigned_doctor.full_name}</div>
                                <div className="text-[10px] text-blue-400 font-medium uppercase">{data.assigned_doctor.specialization || 'General Physician'}</div>
                            </div>
                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
                                {data.assigned_doctor.phone && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Phone className="w-3 h-3" /> {data.assigned_doctor.phone}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <a href={`tel:${data.assigned_doctor.phone}`} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors">
                                        <Phone className="w-3 h-3" /> Call
                                    </a>
                                    <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors">
                                        <MessageSquare className="w-3 h-3" /> Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ward Info */}
                    {data.profile.ward && (
                        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10 flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Shield className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] text-emerald-400 uppercase font-bold">Location</h4>
                                <div className="text-sm font-bold text-emerald-200">Ward {data.profile.ward}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-500/10 text-red-400 font-medium transition-colors">
                        <LogOut className="w-5 h-5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-[#161b22] border-b border-gray-800 flex items-center px-8 justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome, {data.profile.first_name}</h1>
                        <p className="text-sm text-gray-400">Here's your latest health overview.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={handleDownloadHealthReport}
                            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <FileText className="w-4 h-4" /> My Report
                        </button>
                        <button 
                            onClick={() => setShowVitalsForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                            <Zap className="w-4 h-4" /> Analyze My Vitals
                        </button>
                        <div className="w-10 h-10 bg-[#1f2632] rounded-full flex items-center justify-center border border-gray-700">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </header>

                <div className="p-8 overflow-y-auto flex-1 space-y-8">
                    {/* Top Row: Health Score + Doctor + Next Appointment + Latest Bill */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* Health Score Card */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-200">Health Score</h3>
                                </div>
                            </div>
                            {healthScore ? (
                                <>
                                    <div className="flex items-end gap-3">
                                        <p className="text-4xl font-black" style={{ color: getScoreColor(healthScore.score) }}>{Math.round(healthScore.score)}</p>
                                        <span className="text-gray-400 text-sm mb-1">/100</span>
                                        {scoreTrend !== null && (
                                            <div className={`flex items-center gap-1 mb-1 text-xs font-bold px-2 py-0.5 rounded ${scoreTrend <= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {scoreTrend <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                                {Math.abs(Math.round(scoreTrend))}% {scoreTrend <= 0 ? 'Improv.' : 'Risk Incr.'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        {(() => {
                                            const risk = getRiskLabel(healthScore.risk_level);
                                            return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold" style={{ background: risk.bg, color: risk.color }}>{risk.text}</span>;
                                        })()}
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                                        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(healthScore.score, 100)}%`, background: getScoreColor(healthScore.score) }} />
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-400">No score available yet</p>
                            )}
                        </motion.div>

                        {/* Assigned Doctor */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-200">Assigned Doctor</h3>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic">
                                    Dr. {data.assigned_doctor?.full_name || 'Unassigned'}
                                </p>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{data.assigned_doctor?.specialization || 'Assigned Specialist'}</p>
                             </div>
                             {data.assigned_doctor?.phone && (
                                <div className="mt-4 flex gap-2">
                                    <div className="flex-1 bg-blue-600/10 text-blue-400 text-xs py-2 rounded-xl flex items-center justify-center gap-2 border border-blue-500/20">
                                        <Phone className="w-3 h-3" /> {data.assigned_doctor.phone}
                                    </div>
                                </div>
                             )}
                        </motion.div>

                        {/* Next Appointment */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-200">Next Appointment</h3>
                                </div>
                            </div>
                            {upcomingAppointments.length > 0 ? (
                                <>
                                    <p className="text-xl font-medium">{new Date(upcomingAppointments[0].scheduled_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-400 mt-1">{new Date(upcomingAppointments[0].scheduled_at).toLocaleTimeString()}</p>
                                    <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold mt-3">
                                        {upcomingAppointments[0].status}
                                    </span>
                                </>
                            ) : (
                                <p className="text-gray-400">No upcoming appointments</p>
                            )}
                        </motion.div>

                        {/* Recent Billing */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-200">Latest Bill</h3>
                                </div>
                            </div>
                            {data.billing.length > 0 ? (
                                <>
                                    <p className="text-3xl font-bold">${data.billing[0].total_amount}</p>
                                    <p className="text-sm text-gray-400 mt-1">From {new Date(data.billing[0].billed_at).toLocaleDateString()}</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-3 ${data.billing[0].status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {data.billing[0].status}
                                    </span>
                                </>
                            ) : (
                                <p className="text-gray-400">No billing history</p>
                            )}
                        </motion.div>
                    </div>

                    {/* Vitals Chart */}
                    <div className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-xl font-bold mb-6">Vitals History</h3>
                        {vitalsChartData.length > 0 ? (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={vitalsChartData}>
                                        <defs>
                                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="time" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2632', border: '1px solid #374151', borderRadius: '8px' }} />
                                        <Area type="monotone" dataKey="hr" stroke="#ef4444" fillOpacity={1} fill="url(#colorHr)" name="Heart Rate" />
                                        <Area type="monotone" dataKey="sys" stroke="#3b82f6" fillOpacity={0} name="Systolic BP" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-gray-500">
                                No recent vitals recorded.
                            </div>
                        )}
                    </div>

                    {/* Health Insights Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" /> Health Insights
                            </h3>
                            <div className="space-y-4">
                                {(() => {
                                    const latestVitals = vitalsChartData[vitalsChartData.length - 1];
                                    const assessment = generateClinicalAssessment(latestVitals);
                                    if (assessment.length === 0) return <p className="text-gray-400 italic">Record your vitals to see AI-powered health insights.</p>;
                                    return assessment.map((note, i) => (
                                        <div key={i} className={`p-4 rounded-xl border transition-all ${
                                            note.type === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 
                                            note.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' : 
                                            'bg-green-500/10 border-green-500/20 text-green-200'
                                        }`}>
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                                    note.type === 'critical' ? 'bg-red-500' : 
                                                    note.type === 'warning' ? 'bg-yellow-500' : 
                                                    'bg-green-500'
                                                }`} />
                                                <p className="text-sm leading-relaxed">{note.text}</p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Personalized Recommendations */}
                        <div className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-400" /> Daily Recommendations
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                                        <Activity className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-200">Consistency is Key</h4>
                                        <p className="text-xs text-gray-400 mt-1">Recording your vitals at the same time every day helps our AI provide more accurate insights.</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
                                        <Calendar className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-200">Upcoming Check-up</h4>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {upcomingAppointments.length > 0 ? `Your next visit is on ${new Date(upcomingAppointments[0].scheduled_at).toLocaleDateString()}. Make sure to have your vitals history ready.` : "You don't have any appointments scheduled. Consider a routine check-up."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Day Insights & Daily Check-in Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Daily Check-in (Symptoms) */}
                        <div className="md:col-span-1 bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Smile className="w-5 h-5 text-indigo-400" /> Daily Check-in
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">How are you feeling today?</p>
                                </div>
                                <button 
                                    onClick={() => setShowSymptomModal(true)}
                                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {data.symptom_logs?.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                                {data.symptom_logs[0].mood === 'Great' ? <Smile className="w-4 h-4 text-green-400" /> : 
                                                 data.symptom_logs[0].mood === 'Good' ? <Smile className="w-4 h-4 text-green-400" /> : 
                                                 data.symptom_logs[0].mood === 'Neutral' ? <Meh className="w-4 h-4 text-yellow-400" /> : 
                                                 <Frown className="w-4 h-4 text-red-400" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-200">{data.symptom_logs[0].mood} Mood</div>
                                                <div className="text-[10px] text-gray-500">{new Date(data.symptom_logs[0].logged_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] text-gray-400 uppercase">Pain Level:</span>
                                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500" style={{ width: `${data.symptom_logs[0].pain_level * 10}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-300">{data.symptom_logs[0].pain_level}/10</span>
                                        </div>
                                        {data.symptom_logs[0].notes && (
                                            <p className="text-xs text-gray-400 mt-2 italic">"{data.symptom_logs[0].notes}"</p>
                                        )}
                                    </div>
                                    <button className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest font-bold">
                                        View Log History
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm italic">No logs for today yet.</p>
                                    <button 
                                        onClick={() => setShowSymptomModal(true)}
                                        className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold"
                                    >
                                        Log My Symptoms
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Medications Tracking */}
                        <div className="md:col-span-2 bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-emerald-400" /> Active Medications
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">Your current treatment plan</p>
                                </div>
                                <button 
                                    onClick={() => setShowMedicationModal(true)}
                                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add Med
                                </button>
                            </div>

                            {data.medications?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.medications.map((med, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-[#0d1117] border border-gray-800 relative group">
                                            <button 
                                                onClick={() => handleDeleteMedication(med.medication_id)}
                                                className="absolute top-2 right-2 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <div className="font-bold text-gray-100">{med.name}</div>
                                            <div className="text-xs text-blue-400 font-medium mt-1 uppercase tracking-tighter">{med.dosage} • {med.frequency}</div>
                                            {med.instructions && (
                                                <div className="mt-2 flex items-start gap-2 text-[11px] text-gray-500 bg-gray-800/30 p-2 rounded-lg">
                                                    <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                                    {med.instructions}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-900/10 rounded-2xl border border-dashed border-gray-800">
                                    <p className="text-gray-500 text-sm">No active medications listed.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Appointment History */}
                    <div className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Appointment History</h3>
                            <span className="text-sm text-gray-400">{pastAppointments.length} past appointments</span>
                        </div>
                        {pastAppointments.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-gray-400 text-sm border-b border-gray-800">
                                                <th className="pb-4 font-medium">Date & Time</th>
                                                <th className="pb-4 font-medium">Doctor</th>
                                                <th className="pb-4 font-medium">Reason</th>
                                                <th className="pb-4 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {displayedPast.map((appt, i) => (
                                                <tr key={i} className="text-sm hover:bg-[#262d3a] transition-colors">
                                                    <td className="py-4 text-gray-300">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                            <div>
                                                                <div>{new Date(appt.scheduled_at).toLocaleDateString()}</div>
                                                                <div className="text-xs text-gray-500">{new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 font-medium text-gray-200">Dr. {appt.doctor_name || 'N/A'}</td>
                                                    <td className="py-4 text-gray-400">{appt.reason || 'General Consultation'}</td>
                                                    <td className="py-4">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                            appt.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                                                            appt.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 
                                                            'bg-yellow-500/10 text-yellow-500'
                                                        }`}>
                                                            {appt.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {pastAppointments.length > 5 && (
                                    <button 
                                        onClick={() => setShowAllAppointments(!showAllAppointments)}
                                        className="mt-4 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mx-auto transition-colors"
                                    >
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showAllAppointments ? 'rotate-180' : ''}`} />
                                        {showAllAppointments ? 'Show Less' : `Show All ${pastAppointments.length} Appointments`}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No past appointments found.</p>
                        )}
                    </div>

                    {/* Billing Section */}
                    <div className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Billing History</h3>
                        </div>
                        {data.billing.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-400 text-sm border-b border-gray-800">
                                            <th className="pb-4 font-medium">Date</th>
                                            <th className="pb-4 font-medium">Amount</th>
                                            <th className="pb-4 font-medium">Status</th>
                                            <th className="pb-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {data.billing.map((bill, i) => (
                                            <tr key={i} className="text-sm">
                                                <td className="py-4 text-gray-300">{new Date(bill.billed_at).toLocaleDateString()}</td>
                                                <td className="py-4 font-bold text-green-400">${bill.total_amount}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${bill.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                        {bill.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button 
                                                        onClick={() => handleDownloadBill(bill)}
                                                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 ml-auto"
                                                    >
                                                        <FileText className="w-4 h-4" /> Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">No billing history found.</p>
                        )}
                    </div>
                </div>
            </main>

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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Plus className="w-6 h-6 text-emerald-400" /> Add Medication
                            </h2>
                            <form onSubmit={handleAddMedication} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold ml-1">Medication Name</label>
                                    <input required type="text" placeholder="e.g. Paracetamol" value={medicationForm.name} onChange={e => setMedicationForm({...medicationForm, name: e.target.value})}
                                        className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-colors mt-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold ml-1">Dosage</label>
                                        <input type="text" placeholder="500mg" value={medicationForm.dosage} onChange={e => setMedicationForm({...medicationForm, dosage: e.target.value})}
                                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 mt-2" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold ml-1">Frequency</label>
                                        <input type="text" placeholder="Twice daily" value={medicationForm.frequency} onChange={e => setMedicationForm({...medicationForm, frequency: e.target.value})}
                                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 mt-2" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold ml-1">Instructions</label>
                                    <textarea rows={3} placeholder="Take after meals..." value={medicationForm.instructions} onChange={e => setMedicationForm({...medicationForm, instructions: e.target.value})}
                                        className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 mt-2 resize-none" />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowMedicationModal(false)} className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-900/20">Add Medication</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Symptom/Mood Modal */}
                {showSymptomModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Smile className="w-6 h-6 text-indigo-400" /> Daily Check-in
                            </h2>
                            <form onSubmit={handleAddSymptomLog} className="space-y-6">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-4">How is your mood?</label>
                                    <div className="flex justify-between gap-2">
                                        {['Great', 'Good', 'Neutral', 'Bad', 'Awful'].map(m => (
                                            <button key={m} type="button" onClick={() => setSymptomForm({...symptomForm, mood: m})}
                                                className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${symptomForm.mood === m ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-gray-800/30 border-gray-800 text-gray-500'}`}>
                                                {m === 'Great' && <Smile className="w-6 h-6" />}
                                                {m === 'Good' && <Smile className="w-6 h-6" />}
                                                {m === 'Neutral' && <Meh className="w-6 h-6" />}
                                                {m === 'Bad' && <Frown className="w-6 h-6" />}
                                                {m === 'Awful' && <Frown className="w-6 h-6" />}
                                                <span className="text-[10px] uppercase font-black">{m}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Pain Level</label>
                                        <span className={`text-sm font-black p-1 rounded-lg ${symptomForm.pain_level > 7 ? 'text-red-400' : symptomForm.pain_level > 3 ? 'text-yellow-400' : 'text-green-400'}`}>{symptomForm.pain_level}/10</span>
                                    </div>
                                    <input type="range" min="0" max="10" step="1" value={symptomForm.pain_level} onChange={e => setSymptomForm({...symptomForm, pain_level: parseInt(e.target.value)})}
                                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold ml-1">Additional Notes</label>
                                    <textarea rows={3} placeholder="Anything else you'd like to note?" value={symptomForm.notes} onChange={e => setSymptomForm({...symptomForm, notes: e.target.value})}
                                        className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 mt-2 resize-none" />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setShowSymptomModal(false)} className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition-colors">Skip</button>
                                    <button type="submit" className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-900/20">Submit Log</button>
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
