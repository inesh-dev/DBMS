import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Heart, Lock, Phone } from 'lucide-react';
import axios from 'axios';

function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const roleParam = queryParams.get('role'); // 'DOCTOR' or 'PATIENT'

    const title = roleParam === 'DOCTOR' ? 'Doctor Portal' : 
                  roleParam === 'PATIENT' ? 'Patient Portal' : 
                  'VibeCare Portal';

    const loginText = roleParam === 'DOCTOR' ? 'Doctor Credentials' : 
                      roleParam === 'PATIENT' ? 'Patient Credentials' : 
                      'Sign In';

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/login/', { phone, password });
            const { access, role, user_id } = res.data;
            
            // Store token
            localStorage.setItem('access_token', access);
            localStorage.setItem('user_role', role);
            localStorage.setItem('user_id', user_id);

            // Redirect
            if (role === 'PATIENT') {
                window.location.href = `/patient-dashboard`;
            } else if (role === 'DOCTOR' || role === 'ADMIN') {
                window.location.href = `/doctor-dashboard`;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1f2632] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl"
            >
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <Heart className="w-8 h-8 text-blue-500" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                            {title}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                            <input 
                                type="text" 
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[#0d1117] border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-blue-500 focus:outline-none text-white placeholder-gray-600 transition-colors"
                                placeholder="Enter your phone number"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0d1117] border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-blue-500 focus:outline-none text-white placeholder-gray-600 transition-colors"
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20 mt-4"
                    >
                        {loading ? 'Authenticating...' : loginText}
                    </button>
                    
                    <div className="text-center mt-6">
                        <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                            ← Back to Home
                        </a>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default Login;
