import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Activity, AlertTriangle, Calendar, CheckCircle, Copy, ArrowRight, ArrowLeft, Stethoscope, User, Zap } from 'lucide-react';
import { checkVitals, bookAppointment } from '../api';

/* ─── Style tokens (matching VibeCare system) ───────────────────────────── */
const T = {
    blue600:  '#2563eb',
    blue700:  '#1d4ed8',
    blue50:   '#eff6ff',
    blue100:  '#dbeafe',
    slate900: '#0f172a',
    slate700: '#334155',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    white:    '#ffffff',
    bodyFont: "'DM Sans', system-ui, sans-serif",
    displayFont: "'DM Serif Display', Georgia, serif",
};

/* ─── Shared input style ────────────────────────────────────────────────── */
function VField({ label, name, type = 'text', placeholder, required, onChange, optional }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label style={{
                display: 'block', fontSize: 10, fontWeight: 700,
                color: T.slate400, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 7,
                fontFamily: T.bodyFont,
            }}>
                {label}
                {optional && <span style={{ color: '#c7d2fe', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(optional)</span>}
            </label>
            <input
                type={type}
                name={name}
                required={required}
                placeholder={placeholder}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: '100%',
                    background: focused ? T.white : T.slate100,
                    border: `1.5px solid ${focused ? T.blue600 : T.slate200}`,
                    borderRadius: 12,
                    padding: '11px 14px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: T.slate900,
                    fontFamily: T.bodyFont,
                    outline: 'none',
                    boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                    transition: 'all 0.18s',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );
}

/* ─── Circular score ring ───────────────────────────────────────────────── */
function ScoreRing({ score, color, size = 120 }) {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);
    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeOpacity="0.12" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: size > 100 ? 26 : 22, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: T.bodyFont }}>{score}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.slate400, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Score</span>
            </div>
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
function VitalsCheckForm({ onClose, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        phone: initialData.phone || '',
        age: initialData.age || '',
        email: initialData.email || '',
        blood_pressure_systolic: '', blood_pressure_diastolic: '',
        heart_rate: '', glucose_level: '', oxygen_saturation: ''
    });
    const [step, setStep] = useState(1);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [copied, setCopied] = useState(false);

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
                dob: '1990-01-01',
                doctor_id: selectedDoctor.doctor_id,
                date: selectedSlot.date,
                slot_start: selectedSlot.start,
            });
            if (res.credentials) setResult({ ...result, credentials: res.credentials });
            setBookingSuccess(true);
        } catch (err) {
            alert('Failed to book appointment: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`Phone: ${result.credentials.phone}\nPassword: ${result.credentials.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isHealthy = result?.health_score >= 90 && !result?.abnormal;
    const scoreColor = isHealthy ? '#16a34a' : result?.health_score > 70 ? '#d97706' : '#dc2626';
    const scoreLabel = isHealthy ? 'Excellent' : result?.health_score > 70 ? 'Moderate Risk' : 'Needs Attention';

    /* shared button styles */
    const btnPrimary = {
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: T.white, border: 'none', borderRadius: 12,
        padding: '12px 24px', fontSize: 14, fontWeight: 700,
        fontFamily: T.bodyFont, cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(37,99,235,0.32)',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all 0.18s',
    };
    const btnGhost = {
        background: T.slate100, color: T.slate700,
        border: `1.5px solid ${T.slate200}`, borderRadius: 12,
        padding: '12px 20px', fontSize: 14, fontWeight: 600,
        fontFamily: T.bodyFont, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all 0.18s',
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&display=swap');
                .vc-vf-scroll::-webkit-scrollbar { width: 4px; }
                .vc-vf-scroll::-webkit-scrollbar-track { background: transparent; }
                .vc-vf-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
                .vc-slot-btn:hover { border-color: #2563eb !important; color: #2563eb !important; background: #eff6ff !important; }
                .vc-doc-card:hover { border-color: #bfdbfe !important; box-shadow: 0 4px 20px rgba(37,99,235,0.08) !important; }
                .vc-primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.42) !important; }
                .vc-primary-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                @media (max-width: 560px) {
                    .vc-vitals-grid { grid-template-columns: 1fr !important; }
                    .vc-score-row { flex-direction: column !important; align-items: center !important; }
                }
            `}</style>

            <div style={{
                position: 'fixed', inset: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)',
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        background: T.white,
                        borderRadius: 24,
                        width: '100%',
                        maxWidth: 640,
                        maxHeight: '92vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 24px 64px rgba(37,99,235,0.14), 0 48px 100px rgba(0,0,0,0.1)',
                        border: `1px solid ${T.slate200}`,
                        overflow: 'hidden',
                    }}
                >

                    {/* ── Modal header ─────────────────────────────────── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px 28px', borderBottom: `1px solid ${T.slate200}`,
                        background: T.white, flexShrink: 0,
                        position: 'relative',
                    }}>
                        {/* Top accent */}
                        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 3, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: '0 0 8px 8px' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, background: T.blue50, border: `1.5px solid ${T.blue100}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity style={{ width: 18, height: 18, color: T.blue600 }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 16, fontWeight: 800, color: T.slate900, letterSpacing: '-0.02em', margin: 0, fontFamily: T.bodyFont }}>AI Vitals Evaluation</h2>
                                <p style={{ fontSize: 11, color: T.slate400, fontWeight: 600, margin: 0 }}>
                                    {step === 1 ? 'Enter your health metrics below' : 'Your personalized health assessment'}
                                </p>
                            </div>
                        </div>

                        {/* Step indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {[1, 2].map(s => (
                                    <div key={s} style={{
                                        width: s === step ? 20 : 8, height: 8,
                                        borderRadius: 99,
                                        background: s === step ? T.blue600 : (s < step ? '#bfdbfe' : T.slate200),
                                        transition: 'all 0.3s',
                                    }} />
                                ))}
                            </div>
                            <button
                                onClick={onClose}
                                style={{ width: 34, height: 34, background: T.slate100, border: `1px solid ${T.slate200}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.background = T.slate100}
                            >
                                <X style={{ width: 15, height: 15, color: T.slate500 }} />
                            </button>
                        </div>
                    </div>

                    {/* ── Scrollable body ───────────────────────────────── */}
                    <div className="vc-vf-scroll" style={{ overflowY: 'auto', flex: 1, padding: '28px' }}>
                        <AnimatePresence mode="wait">

                            {/* ── Step 1: Input form ──────────────────────── */}
                            {step === 1 && (
                                <motion.form
                                    key="step1"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    transition={{ duration: 0.28 }}
                                    onSubmit={handleSubmit}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
                                >
                                    {/* Personal info section */}
                                    {(!initialData.name || !initialData.phone) && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                                <User style={{ width: 14, height: 14, color: T.blue600 }} />
                                                <span style={{ fontSize: 12, fontWeight: 700, color: T.slate700, letterSpacing: '-0.01em', fontFamily: T.bodyFont }}>Personal Information</span>
                                                <div style={{ flex: 1, height: 1, background: T.slate200 }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                                {!initialData.name && (
                                                    <VField label="Full Name" name="name" placeholder="e.g. John Smith" required onChange={handleChange} />
                                                )}
                                                {!initialData.phone && (
                                                    <VField label="Phone Number" name="phone" placeholder="e.g. 9800000000" required onChange={handleChange} />
                                                )}
                                                {!initialData.email && (
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <VField label="Email Address" name="email" type="email" placeholder="john@example.com" optional onChange={handleChange} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vitals section */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <Activity style={{ width: 14, height: 14, color: T.blue600 }} />
                                            <span style={{ fontSize: 12, fontWeight: 700, color: T.slate700, letterSpacing: '-0.01em', fontFamily: T.bodyFont }}>Vitals Measurement</span>
                                            <div style={{ flex: 1, height: 1, background: T.slate200 }} />
                                            <span style={{ fontSize: 10, color: T.slate400, fontWeight: 600 }}>Enter any you know</span>
                                        </div>

                                        {/* BP row with divider label */}
                                        <div style={{ background: T.slate100, border: `1px solid ${T.slate200}`, borderRadius: 16, padding: '20px', marginBottom: 14 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Blood Pressure</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <VField label="Systolic (mmHg)" name="blood_pressure_systolic" type="number" placeholder="e.g. 120" onChange={handleChange} />
                                                <VField label="Diastolic (mmHg)" name="blood_pressure_diastolic" type="number" placeholder="e.g. 80" onChange={handleChange} />
                                            </div>
                                        </div>

                                        <div className="vc-vitals-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                            <VField label="Heart Rate (bpm)" name="heart_rate" type="number" placeholder="e.g. 72" onChange={handleChange} />
                                            <VField label="Glucose (mg/dL)" name="glucose_level" type="number" placeholder="e.g. 95" onChange={handleChange} />
                                            <VField label="SpO₂ (%)" name="oxygen_saturation" type="number" placeholder="e.g. 98" onChange={handleChange} />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                                        <button type="button" onClick={onClose} style={btnGhost}
                                            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                            onMouseLeave={e => e.currentTarget.style.background = T.slate100}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={loading} className="vc-primary-btn" style={btnPrimary}>
                                            {loading ? (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
                                                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                                    </svg>
                                                    Analyzing…
                                                </>
                                            ) : (
                                                <><Zap style={{ width: 15, height: 15 }} /> Analyze Vitals</>
                                            )}
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {/* ── Step 2: Results ─────────────────────────── */}
                            {step === 2 && result && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.28 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
                                >
                                    {/* ── Healthy result ───────────────────── */}
                                    {isHealthy ? (
                                        <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                                <ScoreRing score={result.health_score} color="#16a34a" size={140} />
                                            </div>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 99, padding: '5px 14px', marginBottom: 16 }}>
                                                <CheckCircle style={{ width: 13, height: 13, color: '#16a34a' }} />
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Excellent Health</span>
                                            </div>
                                            <h3 style={{ fontSize: 26, fontWeight: 900, color: T.slate900, letterSpacing: '-0.03em', marginBottom: 10, fontFamily: T.displayFont }}>You're in great shape!</h3>
                                            <p style={{ fontSize: 15, color: T.slate500, maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.7 }}>{result.message}</p>
                                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                                <button onClick={onClose} className="vc-primary-btn" style={btnPrimary}>
                                                    Done <ArrowRight style={{ width: 14, height: 14 }} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Score + Alert row */}
                                            <div className="vc-score-row" style={{ display: 'flex', gap: 16 }}>
                                                {/* Score card */}
                                                <div style={{
                                                    background: T.slate100, border: `1.5px solid ${T.slate200}`,
                                                    borderRadius: 20, padding: '24px 20px',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                    minWidth: 140,
                                                }}>
                                                    <ScoreRing score={result.health_score} color={scoreColor} size={110} />
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                                                        textTransform: 'uppercase', color: scoreColor,
                                                        background: scoreColor + '18',
                                                        padding: '3px 10px', borderRadius: 99,
                                                    }}>
                                                        {scoreLabel}
                                                    </span>
                                                </div>

                                                {/* Alert card */}
                                                <div style={{
                                                    flex: 1, background: '#fef2f2',
                                                    border: '1.5px solid #fecaca',
                                                    borderRadius: 20, padding: '22px 20px',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                                                        <div style={{ width: 34, height: 34, background: '#fee2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <AlertTriangle style={{ width: 16, height: 16, color: '#dc2626' }} />
                                                        </div>
                                                        <span style={{ fontSize: 15, fontWeight: 800, color: '#991b1b', letterSpacing: '-0.02em', fontFamily: T.displayFont }}>Attention Needed</span>
                                                    </div>
                                                    <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.6, marginBottom: 12 }}>{result.message}</p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {(result.reasons || []).map((r, i) => (
                                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', marginTop: 5, flexShrink: 0 }} />
                                                                <span style={{ fontSize: 12, color: '#b91c1c', fontWeight: 500, lineHeight: 1.5 }}>{r}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Booking / success */}
                                            {!bookingSuccess ? (
                                                <>
                                                    {/* Specialists header */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Stethoscope style={{ width: 14, height: 14, color: T.blue600 }} />
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.slate700, fontFamily: T.bodyFont }}>Available Specialists</span>
                                                        <div style={{ flex: 1, height: 1, background: T.slate200 }} />
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        {(result.doctors || []).map(doc => {
                                                            const isSelected = selectedDoctor?.doctor_id === doc.doctor_id;
                                                            return (
                                                                <div
                                                                    key={doc.doctor_id}
                                                                    className={isSelected ? '' : 'vc-doc-card'}
                                                                    onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); }}
                                                                    style={{
                                                                        padding: '18px 20px',
                                                                        borderRadius: 16,
                                                                        border: `1.5px solid ${isSelected ? T.blue600 : T.slate200}`,
                                                                        background: isSelected ? T.blue50 : T.white,
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.18s',
                                                                        boxShadow: isSelected ? '0 4px 20px rgba(37,99,235,0.12)' : 'none',
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                                                        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                                                            <div style={{
                                                                                width: 44, height: 44, borderRadius: 14,
                                                                                background: isSelected ? T.blue100 : T.slate100,
                                                                                border: `1.5px solid ${isSelected ? T.blue200 : T.slate200}`,
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                            }}>
                                                                                <Stethoscope style={{ width: 18, height: 18, color: isSelected ? T.blue600 : T.slate400 }} />
                                                                            </div>
                                                                            <div>
                                                                                <div style={{ fontWeight: 800, fontSize: 14, color: T.slate900, letterSpacing: '-0.02em' }}>
                                                                                    {doc.full_name || doc.name || doc.pre_name}
                                                                                </div>
                                                                                <div style={{ fontSize: 12, color: T.blue600, fontWeight: 600, marginTop: 2 }}>
                                                                                    {doc.specialization} · {doc.experience_years} yrs experience
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <div style={{ width: 22, height: 22, background: T.blue600, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                                <CheckCircle style={{ width: 13, height: 13, color: '#fff' }} />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Slots */}
                                                                    {isSelected && (
                                                                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.blue100}` }}>
                                                                            <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Select a time slot</div>
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                                                {(doc.available_slots || []).length === 0 ? (
                                                                                    <span style={{ fontSize: 12, color: T.slate400 }}>No slots available</span>
                                                                                ) : (
                                                                                    (doc.available_slots || []).map(slot => {
                                                                                        const isSlotSelected = selectedSlot?.availability_id === slot.availability_id;
                                                                                        return (
                                                                                            <button
                                                                                                key={slot.availability_id}
                                                                                                className={isSlotSelected ? '' : 'vc-slot-btn'}
                                                                                                onClick={e => { e.stopPropagation(); setSelectedSlot(slot); }}
                                                                                                style={{
                                                                                                    padding: '7px 14px', borderRadius: 9,
                                                                                                    border: `1.5px solid ${isSlotSelected ? T.blue600 : T.slate200}`,
                                                                                                    background: isSlotSelected ? T.blue600 : T.white,
                                                                                                    color: isSlotSelected ? '#fff' : T.slate700,
                                                                                                    fontSize: 12, fontWeight: 700,
                                                                                                    fontFamily: T.bodyFont,
                                                                                                    cursor: 'pointer',
                                                                                                    transition: 'all 0.15s',
                                                                                                }}
                                                                                            >
                                                                                                {slot.date} · {slot.start.substring(0, 5)}
                                                                                            </button>
                                                                                        );
                                                                                    })
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Confirm row */}
                                                    {selectedSlot && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            style={{
                                                                display: 'flex', justifyContent: 'flex-end', gap: 12,
                                                                paddingTop: 16, borderTop: `1px solid ${T.slate200}`,
                                                            }}
                                                        >
                                                            <button onClick={() => setStep(1)} style={btnGhost}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                                                onMouseLeave={e => e.currentTarget.style.background = T.slate100}
                                                            >
                                                                <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                                                            </button>
                                                            <button onClick={handleBook} disabled={loading} className="vc-primary-btn" style={btnPrimary}>
                                                                {loading ? (
                                                                    <>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
                                                                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                                                        </svg>
                                                                        Booking…
                                                                    </>
                                                                ) : (
                                                                    <><Calendar style={{ width: 15, height: 15 }} /> Confirm Appointment</>
                                                                )}
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </>
                                            ) : (
                                                /* ── Booking success ──────────────────────── */
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.97 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    style={{ textAlign: 'center' }}
                                                >
                                                    <div style={{ width: 64, height: 64, background: T.blue50, border: `1.5px solid ${T.blue100}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                                        <Calendar style={{ width: 26, height: 26, color: T.blue600 }} />
                                                    </div>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.blue50, border: `1.5px solid ${T.blue100}`, borderRadius: 99, padding: '5px 14px', marginBottom: 14 }}>
                                                        <CheckCircle style={{ width: 12, height: 12, color: T.blue600 }} />
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.blue600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Appointment Confirmed</span>
                                                    </div>
                                                    <h3 style={{ fontSize: 24, fontWeight: 900, color: T.slate900, letterSpacing: '-0.03em', marginBottom: 10, fontFamily: T.displayFont }}>
                                                        You're all set!
                                                    </h3>
                                                    <p style={{ fontSize: 14, color: T.slate500, maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
                                                        {result?.credentials ? 'Save your login credentials below. ' : ''}
                                                        A confirmation has been sent to your email if provided.
                                                    </p>

                                                    {result?.credentials && (
                                                        <div style={{
                                                            background: T.slate100,
                                                            border: `1.5px solid ${T.slate200}`,
                                                            borderRadius: 16, padding: '20px 24px',
                                                            textAlign: 'left', maxWidth: 380, margin: '0 auto 24px',
                                                            position: 'relative',
                                                        }}>
                                                            <div style={{ fontSize: 10, fontWeight: 700, color: T.blue600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Your Login Credentials</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                {[
                                                                    { label: 'Phone', val: result.credentials.phone },
                                                                    { label: 'Password', val: result.credentials.password },
                                                                ].map(({ label, val }) => (
                                                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: 12, color: T.slate400, fontWeight: 600 }}>{label}</span>
                                                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.slate900, fontFamily: 'monospace', background: T.white, padding: '3px 10px', borderRadius: 8, border: `1px solid ${T.slate200}` }}>{val}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button
                                                                onClick={handleCopy}
                                                                style={{
                                                                    marginTop: 14, background: copied ? '#f0fdf4' : T.white,
                                                                    border: `1px solid ${copied ? '#bbf7d0' : T.slate200}`,
                                                                    borderRadius: 9, padding: '7px 14px',
                                                                    fontSize: 11, fontWeight: 700, color: copied ? '#15803d' : T.slate600,
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                                                                    transition: 'all 0.18s', fontFamily: T.bodyFont,
                                                                }}
                                                            >
                                                                {copied ? <CheckCircle style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                                                                {copied ? 'Copied!' : 'Copy credentials'}
                                                            </button>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => window.location.href = '/login'}
                                                        className="vc-primary-btn"
                                                        style={{ ...btnPrimary, padding: '13px 32px', fontSize: 14 }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.42)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.32)'; }}
                                                    >
                                                        Go to Login Portal <ArrowRight style={{ width: 15, height: 15 }} />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
}

export default VitalsCheckForm;