import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Activity, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { checkVitals, bookAppointment } from '../api';

function VitalsCheckForm({ onClose, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || '', 
        phone: initialData.phone || '', 
        age: initialData.age || '', 
        email: initialData.email || '',
        blood_pressure_systolic: '', blood_pressure_diastolic: '',
        heart_rate: '', glucose_level: '', oxygen_saturation: ''
    });
    const [step, setStep] = useState(1); // 1: Form, 2: Result
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Booking states
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await checkVitals(formData);
            setResult(res);
            setStep(2);
        } catch (err) {
            alert('Error checking vitals: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedDoctor || !selectedSlot) return;
        setLoading(true);
        try {
            const res = await bookAppointment({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                dob: '1990-01-01', // Or calculate from age
                doctor_id: selectedDoctor.doctor_id,
                date: selectedSlot.date,
                slot_start: selectedSlot.start
            });
            if (res.credentials) {
                setResult({ ...result, credentials: res.credentials });
            }
            setBookingSuccess(true);
        } catch (err) {
            alert('Failed to book appointment: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1f2632] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-[#1f2632]/95 backdrop-blur z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="text-blue-500" />
                        AI Vitals Evaluation
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                {!initialData.name && (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                                        <input required name="name" onChange={handleChange} className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
                                    </div>
                                )}
                                {!initialData.phone && (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Phone Number *</label>
                                        <input required name="phone" onChange={handleChange} className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
                                    </div>
                                )}
                            </div>
                            
                            {!initialData.name && !initialData.email && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email Address (Optional - Recommended for Credentials)</label>
                                    <input name="email" type="email" onChange={handleChange} placeholder="e.g. john@example.com" className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2" />
                                </div>
                            )}
                            
                            <div><h3 className="text-sm font-semibold text-gray-300 border-b border-gray-800 pb-2">Optional Vitals (Enter any you know)</h3></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Systolic BP</label>
                                    <input type="number" name="blood_pressure_systolic" onChange={handleChange} placeholder="e.g. 120" className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Diastolic BP</label>
                                    <input type="number" name="blood_pressure_diastolic" onChange={handleChange} placeholder="e.g. 80" className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Heart Rate (bpm)</label>
                                    <input type="number" name="heart_rate" onChange={handleChange} placeholder="e.g. 72" className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Glucose Level</label>
                                    <input type="number" name="glucose_level" onChange={handleChange} placeholder="e.g. 95" className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Oxygen Saturation (%)</label>
                                    <input type="number" name="oxygen_saturation" onChange={handleChange} placeholder="e.g. 98" className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors text-gray-300">Cancel</button>
                                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                                    {loading ? 'Analyzing...' : 'Analyze Vitals'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && result && (
                        <div className="space-y-6">
                            {(result?.health_score >= 90 && !result?.abnormal) ? (
                                <div className="text-center py-6">
                                    <div className="relative w-32 h-32 mx-auto mb-6">
                                        <svg className="w-full h-full" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" strokeOpacity="0.1" />
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" 
                                                    strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - (result?.health_score || 0) / 100)}
                                                    strokeLinecap="round" className="transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-green-500">{result?.health_score}</span>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Health Score</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">You are Healthy!</h3>
                                    <p className="text-gray-400 text-lg">{result?.message}</p>
                                    <button onClick={onClose} className="mt-8 bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-xl font-medium transition-colors">Close</button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex flex-col sm:flex-row gap-6 mb-6">
                                        <div className="bg-[#0d1117] rounded-xl p-6 flex flex-col items-center justify-center min-w-[140px] border border-gray-800">
                                            <div className="relative w-24 h-24">
                                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke={(result?.health_score > 70) ? "#eab308" : "#ef4444"} strokeWidth="8" strokeOpacity="0.1" />
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke={(result?.health_score > 70) ? "#eab308" : "#ef4444"} strokeWidth="8" 
                                                            strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - (result?.health_score || 0) / 100)}
                                                            strokeLinecap="round" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className={`text-2xl font-bold ${(result?.health_score > 70) ? "text-yellow-500" : "text-red-500"}`}>{result?.health_score}</span>
                                                    <span className="text-[8px] text-gray-500 uppercase font-bold text-center px-2">Health Score</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <AlertTriangle className="w-6 h-6 text-red-400" />
                                                <h3 className="text-xl font-bold text-red-400">Attention Needed</h3>
                                            </div>
                                            <p className="text-red-300/80 mb-4">{result?.message}</p>
                                            <ul className="list-disc list-inside text-red-300/60 space-y-1 text-sm">
                                                {(result?.reasons || []).map((r, i) => <li key={i}>{r}</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    {!bookingSuccess ? (
                                        <>
                                            <h4 className="text-lg font-bold mb-4">Available Specialists</h4>
                                            <div className="space-y-4">
                                                {(result?.doctors || []).map(doc => (
                                                    <div key={doc.doctor_id} className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedDoctor?.doctor_id === doc.doctor_id ? 'bg-blue-500/10 border-blue-500' : 'bg-[#0d1117] border-gray-800 hover:border-gray-600'}`}
                                                         onClick={() => setSelectedDoctor(doc)}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h5 className="font-bold text-lg">{doc.full_name || doc.name || doc.pre_name}</h5>
                                                                <p className="text-sm text-blue-400">{doc.specialization} • {doc.experience_years} Yrs Exp</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {selectedDoctor?.doctor_id === doc.doctor_id && (
                                                            <div className="mt-4 pt-4 border-t border-gray-800">
                                                                <p className="text-sm text-gray-400 mb-2">Select a time slot:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(doc.available_slots || []).map(slot => (
                                                                        <button key={slot.availability_id}
                                                                                onClick={(e) => { e.stopPropagation(); setSelectedSlot(slot); }}
                                                                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedSlot?.availability_id === slot.availability_id ? 'bg-blue-600 border-blue-600' : 'border-gray-700 hover:border-gray-500'}`}>
                                                                            {slot.date} {slot.start.substring(0,5)}
                                                                        </button>
                                                                    ))}
                                                                    {(doc.available_slots || []).length === 0 && <span className="text-sm text-gray-500">No slots available</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {selectedSlot && (
                                                <div className="mt-6 pt-6 border-t border-gray-800 flex justify-end gap-3">
                                                    <button onClick={() => setStep(1)} className="px-5 py-2 text-gray-400 hover:text-white transition-colors">Back</button>
                                                    <button onClick={handleBook} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20">
                                                        {loading ? 'Booking...' : 'Confirm Appointment'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Calendar className="w-8 h-8 text-blue-500" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">Appointment Confirmed!</h3>
                                            
                                            {result?.credentials && (
                                                <div className="mt-6 bg-[#0d1117] border border-gray-800 rounded-xl p-5 text-left mb-6 max-w-sm mx-auto relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Heart className="w-12 h-12" /></div>
                                                    <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Your Login Credentials</h4>
                                                    <div className="space-y-2">
                                                        <p className="text-sm"><span className="text-gray-500">Phone:</span> <span className="font-mono text-white">{result.credentials.phone}</span></p>
                                                        <p className="text-sm"><span className="text-gray-500">Password:</span> <span className="font-mono text-white">{result.credentials.password}</span></p>
                                                    </div>
                                                    <div className="mt-4 flex gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`Phone: ${result.credentials.phone}\nPassword: ${result.credentials.password}`);
                                                                alert('Copied to clipboard!');
                                                            }}
                                                            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                                                {result?.credentials ? "Please save your credentials above. " : ""}
                                                A confirmation has been sent to your email (if provided).
                                            </p>
                                            <button onClick={() => window.location.href='/login'} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium transition-colors w-full sm:w-auto">
                                                Go to Login Portal
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default VitalsCheckForm;
