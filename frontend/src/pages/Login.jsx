import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Heart, Lock, Phone, ChevronLeft, Stethoscope, User, ShieldCheck } from 'lucide-react';
import axios from 'axios';

function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const roleParam = queryParams.get('role');

    const title = roleParam === 'DOCTOR' ? 'Doctor Portal' :
                  roleParam === 'PATIENT' ? 'Patient Portal' :
                  'Hospital Portal';

    const loginText = roleParam === 'DOCTOR' ? 'Doctor' :
                      roleParam === 'PATIENT' ? 'Patient' :
                      'User';

    const RoleIcon = roleParam === 'DOCTOR' ? Stethoscope : roleParam === 'PATIENT' ? User : ShieldCheck;
    const accentTag = roleParam === 'DOCTOR' ? 'Clinical Staff Access' : roleParam === 'PATIENT' ? 'Patient Access' : 'Authorized Access';

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/login/', { phone, password });
            const { access, role, user_id } = res.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('user_role', role);
            localStorage.setItem('user_id', user_id);
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
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .vc-login-root {
                    min-height: 100vh;
                    display: flex;
                    font-family: 'DM Sans', system-ui, sans-serif;
                    background: #f0f5ff;
                    overflow: hidden;
                    position: relative;
                }

                /* Animated background blobs */
                .vc-blob {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(72px);
                }

                /* Left decorative panel */
                .vc-left-panel {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: flex-start;
                    padding: 60px 64px;
                    flex: 1;
                    position: relative;
                    z-index: 1;
                }

                @media (max-width: 900px) {
                    .vc-left-panel { display: none !important; }
                    .vc-right-panel { width: 100% !important; }
                }

                /* Input focus ring */
                .vc-input:focus {
                    outline: none;
                    border-color: #2563eb !important;
                    background: #fff !important;
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
                }

                .vc-input {
                    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
                }

                /* Submit button */
                .vc-submit-btn {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: #fff;
                    border: none;
                    border-radius: 14px;
                    width: 100%;
                    padding: 15px;
                    font-size: 15px;
                    font-weight: 700;
                    font-family: 'DM Sans', system-ui, sans-serif;
                    cursor: pointer;
                    letter-spacing: -0.01em;
                    box-shadow: 0 4px 20px rgba(37,99,235,0.35), 0 1px 3px rgba(37,99,235,0.2);
                    transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s, opacity 0.18s;
                    position: relative;
                    overflow: hidden;
                }

                .vc-submit-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%);
                    pointer-events: none;
                }

                .vc-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 28px rgba(37,99,235,0.45), 0 2px 6px rgba(37,99,235,0.2);
                }

                .vc-submit-btn:active:not(:disabled) {
                    transform: translateY(0px) scale(0.98);
                }

                .vc-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Back link */
                .vc-back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #94a3b8;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 0.18s;
                    position: relative;
                    font-family: 'DM Sans', system-ui, sans-serif;
                }

                .vc-back-link:hover { color: #2563eb; }

                .vc-back-link .vc-chevron {
                    transition: transform 0.22s cubic-bezier(0.22,1,0.36,1);
                }

                .vc-back-link:hover .vc-chevron {
                    transform: translateX(-4px);
                }

                /* Divider dots on left panel */
                .vc-feature-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 16px 20px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 16px;
                    backdrop-filter: blur(8px);
                    transition: background 0.2s, border-color 0.2s;
                }

                .vc-feature-row:hover {
                    background: rgba(255,255,255,0.18);
                    border-color: rgba(255,255,255,0.25);
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }

                .vc-logo-icon { animation: float 4s ease-in-out infinite; }
            `}</style>

            <div className="vc-login-root">

                {/* ── Background blobs ─────────────────────────────────── */}
                <div className="vc-blob" style={{ width: 600, height: 600, top: -200, left: -100, background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)' }} />
                <div className="vc-blob" style={{ width: 500, height: 500, bottom: -150, right: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)' }} />
                <div className="vc-blob" style={{ width: 300, height: 300, top: '40%', left: '40%', background: 'radial-gradient(circle, rgba(59,130,246,0.07), transparent 70%)' }} />

                {/* ── Left decorative panel ─────────────────────────────── */}
                <div className="vc-left-panel" style={{ background: 'linear-gradient(140deg, #1e40af 0%, #2563eb 45%, #3b82f6 100%)' }}>
                    {/* Subtle grid overlay */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
                            <div className="vc-logo-icon" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                                <Heart style={{ width: 20, height: 20, color: '#fff' }} />
                            </div>
                            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'DM Sans', sans-serif" }}>
                                VibeCare<span style={{ opacity: 0.7 }}>Hospital</span>
                            </span>
                        </div>

                        {/* Headline */}
                        <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 18, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                            Smarter care,<br />
                            <span style={{ opacity: 0.8 }}>right at your</span><br />
                            fingertips.
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: 48, maxWidth: 340 }}>
                            AI-powered clinical monitoring and seamless patient management — all in one secure platform.
                        </p>

                        {/* Feature chips */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { icon: ShieldCheck, text: 'HIPAA-compliant secure access' },
                                { icon: Heart,       text: 'Real-time vitals & AI health scores' },
                                { icon: Stethoscope, text: 'Seamless patient management' },
                            ].map(({ icon: Icon, text }, i) => (
                                <div key={i} className="vc-feature-row">
                                    <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon style={{ width: 15, height: 15, color: '#fff' }} />
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom copyright */}
                    <div style={{ position: 'absolute', bottom: 32, left: 64, color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500 }}>
                        © {new Date().getFullYear()} VibeCare Hospital
                    </div>
                </div>

                {/* ── Right: Login card ─────────────────────────────────── */}
                <div
                    className="vc-right-panel"
                    style={{ width: 520, minWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', position: 'relative', zIndex: 1 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            background: '#ffffff',
                            borderRadius: 28,
                            padding: '48px 44px',
                            width: '100%',
                            maxWidth: 460,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(37,99,235,0.1), 0 32px 80px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(226,232,240,0.8)',
                            position: 'relative',
                        }}
                    >
                        {/* Top accent bar */}
                        <div style={{ position: 'absolute', top: 0, left: 40, right: 40, height: 3, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: '0 0 8px 8px' }} />

                        {/* Icon + role badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    width: 72, height: 72,
                                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                    borderRadius: 22,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 20,
                                    border: '1.5px solid #bfdbfe',
                                    boxShadow: '0 4px 20px rgba(37,99,235,0.12)',
                                }}
                            >
                                <RoleIcon style={{ width: 30, height: 30, color: '#2563eb' }} />
                            </motion.div>

                            {/* Role tag */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: '#eff6ff', border: '1.5px solid #dbeafe',
                                borderRadius: 99, padding: '4px 12px', marginBottom: 14,
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{accentTag}</span>
                            </div>

                            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', marginBottom: 6, fontFamily: "'DM Serif Display', Georgia, serif", textAlign: 'center' }}>
                                Welcome Back
                            </h1>
                            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 400, textAlign: 'center', lineHeight: 1.5 }}>
                                Sign in to your <strong style={{ fontWeight: 700, color: '#334155' }}>{title}</strong> account
                            </p>
                        </div>

                        {/* Error state */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                style={{
                                    background: '#fef2f2', color: '#dc2626',
                                    padding: '12px 16px', borderRadius: 12, marginBottom: 24,
                                    fontSize: 13, fontWeight: 600, textAlign: 'center',
                                    border: '1px solid #fecaca',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                <span style={{ fontSize: 15 }}>⚠</span> {error}
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Phone field */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Phone Number
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Phone style={{
                                        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                                        width: 16, height: 16,
                                        color: phoneFocused ? '#2563eb' : '#94a3b8',
                                        transition: 'color 0.18s', pointerEvents: 'none',
                                    }} />
                                    <input
                                        type="text"
                                        required
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        onFocus={() => setPhoneFocused(true)}
                                        onBlur={() => setPhoneFocused(false)}
                                        className="vc-input"
                                        placeholder="Enter registered phone"
                                        style={{
                                            width: '100%',
                                            background: '#f8fafc',
                                            border: `1.5px solid ${phoneFocused ? '#2563eb' : '#e2e8f0'}`,
                                            borderRadius: 13,
                                            padding: '13px 16px 13px 44px',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: '#0f172a',
                                            fontFamily: "'DM Sans', system-ui, sans-serif",
                                            boxShadow: phoneFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Password field */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{
                                        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                                        width: 16, height: 16,
                                        color: passFocused ? '#2563eb' : '#94a3b8',
                                        transition: 'color 0.18s', pointerEvents: 'none',
                                    }} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onFocus={() => setPassFocused(true)}
                                        onBlur={() => setPassFocused(false)}
                                        className="vc-input"
                                        placeholder="Enter your password"
                                        style={{
                                            width: '100%',
                                            background: '#f8fafc',
                                            border: `1.5px solid ${passFocused ? '#2563eb' : '#e2e8f0'}`,
                                            borderRadius: 13,
                                            padding: '13px 16px 13px 44px',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: '#0f172a',
                                            fontFamily: "'DM Sans', system-ui, sans-serif",
                                            boxShadow: passFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="vc-submit-btn"
                                style={{ marginTop: 8 }}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
                                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        Authenticating…
                                    </span>
                                ) : `Sign in as ${loginText}`}
                            </button>

                            {/* Back link */}
                            <div style={{ textAlign: 'center', paddingTop: 8 }}>
                                <a href="/" className="vc-back-link">
                                    <ChevronLeft className="vc-chevron" style={{ width: 15, height: 15 }} />
                                    Back to Homepage
                                </a>
                            </div>
                        </form>
                    </motion.div>

                    {/* Footer note */}
                    <p style={{ marginTop: 24, color: '#94a3b8', fontSize: 12, fontWeight: 500, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
                        © {new Date().getFullYear()} VibeCare Hospital Management System
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}

export default Login;