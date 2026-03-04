import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Heart, UserPlus } from 'lucide-react';
import VitalsCheckForm from '../components/VitalsCheckForm';

function LandingPage() {
    const [showVitalsForm, setShowVitalsForm] = useState(false);

    return (
        <div className="min-h-screen bg-[#0d1117] text-white font-sans overflow-x-hidden">
            {/* Header / Nav */}
            <nav className="fixed w-full z-50 bg-[#161b22]/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Heart className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                                VibeCare Hospital
                            </span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
                            <a href="#services" className="text-gray-300 hover:text-white transition-colors">Services</a>
                            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
                        </div>
                        <button 
                            onClick={() => window.location.href = '/login'}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full font-medium transition-all shadow-lg shadow-blue-600/20"
                        >
                            Portal Login
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                        Next-Generation <br/>
                        <span className="text-blue-500">Clinical Monitoring</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Experience world-class healthcare with our advanced patient monitoring system. 
                        We combine cutting-edge technology with compassionate care to ensure your well-being.
                    </p>
                    <button 
                        onClick={() => setShowVitalsForm(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transform transition-all duration-300 px-8 py-4 rounded-full text-lg font-bold flex items-center gap-2 mx-auto shadow-xl shadow-blue-500/25"
                    >
                        <Heart className="w-5 h-5"/>
                        Check Your Vitals Now
                    </button>
                    <p className="mt-4 text-sm text-gray-500">Instant AI Risk Assessment & Booking</p>
                </motion.div>
            </section>

            {/* Features/Services */}
            <section id="services" className="py-20 bg-[#161b22]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-16">Premium Healthcare Services</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Shield, title: "Secure Records", desc: "Your health data is protected with enterprise-grade encryption and privacy controls." },
                            { icon: Clock, title: "24/7 Monitoring", desc: "Round-the-clock intensive care monitoring with real-time alerts." },
                            { icon: UserPlus, title: "Expert Doctors", desc: "Instant booking with our world-renowned specialists across all departments." }
                        ].map((feature, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-[#1f2632] p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors"
                            >
                                <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-7 h-7 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dynamic Vitals Form Modal */}
            <AnimatePresence>
                {showVitalsForm && (
                    <VitalsCheckForm onClose={() => setShowVitalsForm(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}

export default LandingPage;
