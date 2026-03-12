import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Heart, UserPlus, Users, Zap, Activity, ArrowRight, CheckCircle, Star } from 'lucide-react';
import VitalsCheckForm from '../components/VitalsCheckForm';

/* ─── Animation helpers ─────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
});

const stagger = {
    animate: { transition: { staggerChildren: 0.1 } },
};

/* ─── Inline style tokens ───────────────────────────────────────────────── */
const S = {
    // Colors
    blue600: '#2563eb',
    blue700: '#1d4ed8',
    blue50:  '#eff6ff',
    blue100: '#dbeafe',
    slate900: '#0f172a',
    slate700: '#334155',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    white: '#ffffff',

    // Typography
    displayFont: "'DM Serif Display', Georgia, serif",
    bodyFont:    "'DM Sans', system-ui, sans-serif",
};

/* ─── Reusable components ───────────────────────────────────────────────── */
function NavLink({ href, children }) {
    const [hovered, setHovered] = useState(false);
    return (
        <a
            href={href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                color: hovered ? S.blue600 : S.slate700,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                transition: 'color 0.18s',
                paddingBottom: 2,
                fontFamily: S.bodyFont,
            }}
        >
            {children}
            <span style={{
                position: 'absolute', bottom: -2, left: 0,
                width: hovered ? '100%' : 0, height: 2,
                background: S.blue600, borderRadius: 99,
                transition: 'width 0.22s cubic-bezier(0.22,1,0.36,1)',
                display: 'block',
            }} />
        </a>
    );
}

function PrimaryBtn({ onClick, children, large }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: hov ? S.blue700 : S.blue600,
                color: S.white,
                border: 'none',
                borderRadius: 14,
                padding: large ? '16px 32px' : '12px 24px',
                fontSize: large ? 16 : 14,
                fontWeight: 700,
                fontFamily: S.bodyFont,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                boxShadow: hov
                    ? '0 8px 32px rgba(37,99,235,0.45), 0 0 0 0px rgba(37,99,235,0.2)'
                    : '0 4px 20px rgba(37,99,235,0.3)',
                transform: hov ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
            }}
        >
            {children}
        </button>
    );
}

function GhostBtn({ onClick, children, large }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: hov ? S.blue50 : S.white,
                color: hov ? S.blue600 : S.slate700,
                border: `1.5px solid ${hov ? S.blue100 : S.slate200}`,
                borderRadius: 14,
                padding: large ? '15px 30px' : '11px 22px',
                fontSize: large ? 16 : 14,
                fontWeight: 700,
                fontFamily: S.bodyFont,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                boxShadow: hov ? '0 4px 16px rgba(37,99,235,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                transform: hov ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
            }}
        >
            {children}
        </button>
    );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
function LandingPage() {
    const [showVitalsForm, setShowVitalsForm] = useState(false);

    return (
        <>
            {/* Google Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body { font-family: 'DM Sans', system-ui, sans-serif; }

                .vc-hero-bg {
                    background-color: #f8fafc;
                    background-image:
                        radial-gradient(ellipse 80% 60% at 60% -10%, rgba(37,99,235,0.09) 0%, transparent 70%),
                        radial-gradient(ellipse 50% 40% at 100% 80%, rgba(99,102,241,0.06) 0%, transparent 60%),
                        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='30' cy='30' r='1' fill='%232563eb' fill-opacity='0.04'/%3E%3C/g%3E%3C/svg%3E");
                }

                .vc-card-hover:hover {
                    transform: translateY(-6px) !important;
                    border-color: #bfdbfe !important;
                    box-shadow: 0 16px 48px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.04) !important;
                }

                .vc-card-hover { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s, border-color 0.3s; }

                .vc-stat-chip:hover { background: #eff6ff !important; border-color: #bfdbfe !important; }
                .vc-stat-chip { transition: background 0.2s, border-color 0.2s; }

                @media (max-width: 768px) {
                    .vc-hero-grid { flex-direction: column !important; text-align: center !important; }
                    .vc-hero-btns { justify-content: center !important; }
                    .vc-features-grid { grid-template-columns: 1fr !important; }
                    .vc-nav-links { display: none !important; }
                    .vc-hero-eyebrow { justify-content: center !important; }
                    .vc-stats-row { flex-wrap: wrap !important; justify-content: center !important; }
                }

                @media (max-width: 480px) {
                    .vc-hero-title { font-size: 38px !important; }
                    .vc-nav-actions { gap: 8px !important; }
                    .vc-nav-doctor { display: none !important; }
                }
            `}</style>

            <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: S.bodyFont, color: S.slate900, overflowX: 'hidden' }}>

                {/* ── Navbar ─────────────────────────────────────────────── */}
                <nav style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(226,232,240,0.8)',
                    height: 68,
                }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                            <div style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                                <Heart style={{ width: 18, height: 18, color: '#fff' }} />
                            </div>
                            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: S.slate900, fontFamily: S.bodyFont }}>
                                Sahara<span style={{ color: S.blue600 }}>Hospital</span>
                            </span>
                        </div>

                        {/* Nav links */}
                        <div className="vc-nav-links" style={{ display: 'flex', gap: 36 }}>
                            <NavLink href="#about">About</NavLink>
                            <NavLink href="#services">Services</NavLink>
                            <NavLink href="#contact">Contact</NavLink>
                        </div>

                        {/* CTA buttons */}
                        <div className="vc-nav-actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <button
                                className="vc-nav-doctor"
                                onClick={() => window.location.href = '/login?role=DOCTOR'}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: S.slate700, fontWeight: 600, fontSize: 14,
                                    padding: '8px 14px', borderRadius: 10, fontFamily: S.bodyFont,
                                    transition: 'color 0.18s, background 0.18s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = S.blue600; e.currentTarget.style.background = S.blue50; }}
                                onMouseLeave={e => { e.currentTarget.style.color = S.slate700; e.currentTarget.style.background = 'none'; }}
                            >
                                Doctor Portal
                            </button>
                            <div style={{ width: 1, height: 22, background: S.slate200 }} />
                            <button
                                onClick={() => window.location.href = '/login?role=PATIENT'}
                                style={{
                                    background: S.blue600, color: '#fff', border: 'none',
                                    borderRadius: 11, padding: '9px 20px', fontWeight: 700,
                                    fontSize: 14, cursor: 'pointer', fontFamily: S.bodyFont,
                                    boxShadow: '0 2px 10px rgba(37,99,235,0.28)',
                                    transition: 'all 0.18s',
                                    display: 'flex', alignItems: 'center', gap: 7
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = S.blue700; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.38)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = S.blue600; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.28)'; }}
                            >
                                Patient Login <ArrowRight style={{ width: 14, height: 14 }} />
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ── Hero ───────────────────────────────────────────────── */}
                <section
                    className="vc-hero-bg"
                    style={{ paddingTop: 140, paddingBottom: 100, minHeight: '92vh', display: 'flex', alignItems: 'center' }}
                >
                    {/* Decorative blob */}
                    <div style={{
                        position: 'absolute', top: 80, right: -120, width: 600, height: 600,
                        borderRadius: '50%', pointerEvents: 'none',
                        background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: 0, left: -80, width: 400, height: 400,
                        borderRadius: '50%', pointerEvents: 'none',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }} />

                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', position: 'relative' }}>
                        <div className="vc-hero-grid" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

                            {/* Eyebrow badge */}
                            <motion.div className="vc-hero-eyebrow" {...fadeUp(0)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    background: 'white', border: '1.5px solid #dbeafe',
                                    borderRadius: 99, padding: '7px 16px',
                                    boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                                }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                                    <Zap style={{ width: 13, height: 13, color: S.blue600 }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: S.blue600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        AI-Powered Healthcare
                                    </span>
                                </div>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1
                                className="vc-hero-title"
                                {...fadeUp(0.08)}
                                style={{
                                    fontSize: 68,
                                    fontWeight: 900,
                                    letterSpacing: '-0.04em',
                                    lineHeight: 1.04,
                                    color: S.slate900,
                                    maxWidth: 820,
                                    marginBottom: 24,
                                    fontFamily: S.displayFont,
                                }}
                            >
                                Healthcare{' '}
                                <span style={{
                                    color: S.blue600,
                                    position: 'relative',
                                    display: 'inline-block',
                                }}>
                                    Reimagined
                                    <svg
                                        viewBox="0 0 240 12"
                                        style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', pointerEvents: 'none' }}
                                        preserveAspectRatio="none"
                                    >
                                        <path d="M4 8 Q60 2 120 7 Q180 12 236 6" stroke="#93c5fd" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                    </svg>
                                </span>
                                <br />for the Modern World
                            </motion.h1>

                            {/* Subtext */}
                            <motion.p
                                {...fadeUp(0.16)}
                                style={{
                                    fontSize: 18,
                                    color: S.slate500,
                                    maxWidth: 600,
                                    lineHeight: 1.75,
                                    fontWeight: 400,
                                    marginBottom: 44,
                                    fontFamily: S.bodyFont,
                                }}
                            >
                                Sahara Hospital combines advanced clinical monitoring with a seamless digital experience.
                                From AI-driven health insights to instant specialist appointments — we're here for you.
                            </motion.p>

                            {/* CTA buttons */}
                            <motion.div className="vc-hero-btns" {...fadeUp(0.22)} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
                                <PrimaryBtn onClick={() => setShowVitalsForm(true)} large>
                                    <Heart style={{ width: 18, height: 18 }} />
                                    Check Vital Signs
                                </PrimaryBtn>
                                <GhostBtn onClick={() => window.location.href = '/login?role=PATIENT'} large>
                                    Access Dashboard
                                    <ArrowRight style={{ width: 16, height: 16 }} />
                                </GhostBtn>
                            </motion.div>

                            {/* Trust stats row */}
                            <motion.div
                                className="vc-stats-row"
                                {...fadeUp(0.3)}
                                style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}
                            >
                                {[
                                    { icon: Users,         value: '24,000+', label: 'Patients Served' },
                                    { icon: Star,          value: '4.9 / 5',  label: 'Patient Rating' },
                                    { icon: CheckCircle,   value: '99.8%',    label: 'Uptime SLA' },
                                    { icon: Activity,      value: 'Real-time',label: 'Vitals AI' },
                                ].map(({ icon: Icon, value, label }, i) => (
                                    <div
                                        key={i}
                                        className="vc-stat-chip"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            background: S.white,
                                            border: `1px solid ${S.slate200}`,
                                            borderRadius: 12,
                                            padding: '10px 18px',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        <div style={{ width: 30, height: 30, background: S.blue50, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon style={{ width: 14, height: 14, color: S.blue600 }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: S.slate900, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
                                            <div style={{ fontSize: 10, color: S.slate400, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── Services / Feature Cards ────────────────────────────── */}
                <section id="services" style={{ padding: '100px 24px', background: S.white, position: 'relative', overflow: 'hidden' }}>
                    {/* Top fade from hero */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, #f8fafc, white)', pointerEvents: 'none' }} />

                    {/* Subtle grid texture */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
                        backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
                    }} />

                    <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                        {/* Section header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            style={{ textAlign: 'center', marginBottom: 72 }}
                        >
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                background: S.blue50, border: `1.5px solid ${S.blue100}`,
                                borderRadius: 99, padding: '5px 14px', marginBottom: 20,
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: S.blue600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Our Services</span>
                            </div>
                            <h2 style={{
                                fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em',
                                color: S.slate900, marginBottom: 16,
                                fontFamily: S.displayFont,
                            }}>
                                Clinical Excellence
                            </h2>
                            <p style={{ fontSize: 17, color: S.slate500, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontWeight: 400 }}>
                                Modern features designed for optimal patient outcomes and streamlined care delivery.
                            </p>
                        </motion.div>

                        {/* Feature cards */}
                        <div
                            className="vc-features-grid"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
                        >
                            {[
                                {
                                    icon: Shield,
                                    title: 'Secure Records',
                                    desc: 'Enterprise-grade encryption for all your medical history, clinical reports, and personal data.',
                                    accent: '#2563eb',
                                    bg: '#eff6ff',
                                    tag: 'HIPAA Compliant',
                                },
                                {
                                    icon: Clock,
                                    title: 'Smart Scheduling',
                                    desc: 'Instant slot booking with automated reminders, calendar sync, and zero-friction rescheduling.',
                                    accent: '#059669',
                                    bg: '#ecfdf5',
                                    tag: '24 / 7 Access',
                                },
                                {
                                    icon: Activity,
                                    title: 'AI Health Score',
                                    desc: 'Real-time vitals analysis and risk prediction using advanced machine-learning algorithms.',
                                    accent: '#7c3aed',
                                    bg: '#f5f3ff',
                                    tag: 'Live Analysis',
                                },
                            ].map((feat, i) => (
                                <motion.div
                                    key={i}
                                    className="vc-card-hover"
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    style={{
                                        background: S.white,
                                        border: `1.5px solid ${S.slate200}`,
                                        borderRadius: 24,
                                        padding: '36px 32px 32px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0,
                                        cursor: 'default',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Top accent line */}
                                    <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 3, background: `linear-gradient(90deg, ${feat.accent}88, ${feat.accent}22)`, borderRadius: '0 0 4px 4px' }} />

                                    {/* Icon */}
                                    <div style={{
                                        width: 56, height: 56, background: feat.bg,
                                        borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 24,
                                        boxShadow: `0 4px 16px ${feat.accent}18`,
                                    }}>
                                        <feat.icon style={{ width: 26, height: 26, color: feat.accent }} />
                                    </div>

                                    {/* Tag */}
                                    <div style={{ marginBottom: 12 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                                            color: feat.accent, textTransform: 'uppercase',
                                            background: feat.bg,
                                            padding: '3px 10px', borderRadius: 99,
                                        }}>
                                            {feat.tag}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: 22, fontWeight: 800, color: S.slate900, marginBottom: 12, letterSpacing: '-0.02em', fontFamily: S.displayFont }}>
                                        {feat.title}
                                    </h3>
                                    <p style={{ fontSize: 15, color: S.slate500, lineHeight: 1.7, fontWeight: 400, flexGrow: 1 }}>
                                        {feat.desc}
                                    </p>

                                    {/* Learn more link */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 28, color: feat.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                        Learn more <ArrowRight style={{ width: 14, height: 14 }} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Bottom CTA Banner ───────────────────────────────────── */}
                <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55 }}
                        style={{
                            maxWidth: 860,
                            margin: '0 auto',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%)',
                            borderRadius: 28,
                            padding: '56px 48px',
                            textAlign: 'center',
                            boxShadow: '0 20px 60px rgba(37,99,235,0.3)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Decorative circles */}
                        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: -60, left: -20, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                        <div style={{ position: 'relative' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '5px 14px', marginBottom: 20 }}>
                                <Heart style={{ width: 13, height: 13, color: '#fff' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Get Started Today</span>
                            </div>
                            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1, fontFamily: S.displayFont }}>
                                Your Health,<br />Our Priority
                            </h2>
                            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.7 }}>
                                Join thousands of patients experiencing smarter, more connected healthcare with Sahara Hospital.
                            </p>
                            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setShowVitalsForm(true)}
                                    style={{
                                        background: S.white, color: S.blue600, border: 'none',
                                        borderRadius: 12, padding: '13px 28px',
                                        fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                        fontFamily: S.bodyFont,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                        transition: 'transform 0.18s, box-shadow 0.18s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
                                >
                                    <Activity style={{ width: 16, height: 16 }} /> Check My Vitals
                                </button>
                                <button
                                    onClick={() => window.location.href = '/login?role=PATIENT'}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)', color: S.white,
                                        border: '1.5px solid rgba(255,255,255,0.3)',
                                        borderRadius: 12, padding: '13px 28px',
                                        fontWeight: 700, fontSize: 15, cursor: 'pointer',
                                        fontFamily: S.bodyFont,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        transition: 'background 0.18s, transform 0.18s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    Patient Login <ArrowRight style={{ width: 14, height: 14 }} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <footer style={{ background: S.slate900, padding: '40px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 14 }}>
                        <div style={{ background: S.blue600, width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart style={{ width: 14, height: 14, color: '#fff' }} />
                        </div>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', fontFamily: S.bodyFont }}>Sahara<span style={{ color: '#60a5fa' }}>Hospital</span></span>
                    </div>
                    <p style={{ color: '#475569', fontSize: 13, fontFamily: S.bodyFont }}>
                        © {new Date().getFullYear()} Sahara Hospital. All rights reserved.
                    </p>
                </footer>

            </div>

            {/* ── Vitals Form Modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {showVitalsForm && (
                    <VitalsCheckForm onClose={() => setShowVitalsForm(false)} allowBooking={true} />
                )}
            </AnimatePresence>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.3); }
                }
            `}</style>
        </>
    );
}

export default LandingPage;