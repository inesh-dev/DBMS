import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Calendar, DollarSign, LogOut, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function PatientDashboard() {
    const [data, setData] = useState(null);
    const userId = localStorage.getItem('user_id');

    useEffect(() => {
        if (!userId) {
            window.location.href = '/login';
            return;
        }
        const fetchData = async () => {
            try {
                const res = await axios.get(`/api/dashboard/patient/${userId}/`);
                setData(res.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            }
        };
        fetchData();
    }, [userId]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    if (!data) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-blue-500">Loading...</div>;

    const vitalsChartData = data.vitals_history.map(v => ({
        time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hr: v.heart_rate,
        sys: v.bp_sys,
        dia: v.bp_dia,
        glucose: v.glucose_level
    })).reverse(); // oldest to newest for chart

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
                <div className="flex-1 p-4 space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 text-blue-400 font-medium">
                        <Activity className="w-5 h-5" /> Dashboard
                    </div>
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
                    <div className="w-10 h-10 bg-[#1f2632] rounded-full flex items-center justify-center border border-gray-700">
                        <User className="w-5 h-5 text-gray-400" />
                    </div>
                </header>

                <div className="p-8 overflow-y-auto flex-1 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Assigned Doctor */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-200">Assigned Doctor</h3>
                                </div>
                            </div>
                            <p className="text-xl font-medium">Dr. {data.assigned_doctor?.name ? data.assigned_doctor.name.split('@')[0].replace('dr.', '').title() : 'Unassigned'}</p>
                            <p className="text-sm text-gray-400 mt-1">{data.assigned_doctor?.specialization}</p>
                            <p className="text-sm text-blue-400 mt-2">{data.assigned_doctor?.phone}</p>
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
                            {data.appointments.length > 0 ? (
                                <>
                                    <p className="text-xl font-medium">{new Date(data.appointments[0].scheduled_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-400 mt-1">{new Date(data.appointments[0].scheduled_at).toLocaleTimeString()}</p>
                                    <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold mt-3">
                                        {data.appointments[0].status}
                                    </span>
                                </>
                            ) : (
                                <p className="text-gray-400">No upcoming appointments</p>
                            )}
                        </motion.div>

                        {/* Recent Billing */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#1f2632] p-6 rounded-2xl border border-gray-800">
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
                </div>
            </main>
        </div>
    );
}

export default PatientDashboard;
