import React, { useState, useEffect } from 'react';
import {
  Activity, Users, Calendar, Heart, Thermometer, Zap, Bell, Search,
  ChevronUp, ChevronDown, Clock, ArrowRight, FileText, UserPlus,
  LogOut, Phone, X, Shield, TrendingUp, CheckCircle, Stethoscope,
  BarChart2, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDoctorDashboard, getDoctorSchedule, addPatient, addVitals,
  addDoctorAvailability, dischargePatient, acknowledgeAlert, getPatientDetail
} from '../api';

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  blue600:  '#2563eb',
  blue700:  '#1d4ed8',
  blue500:  '#3b82f6',
  blue50:   '#eff6ff',
  blue100:  '#dbeafe',
  blue200:  '#bfdbfe',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  white:    '#ffffff',
  rose600:  '#e11d48',
  rose500:  '#f43f5e',
  rose100:  '#ffe4e6',
  rose50:   '#fff1f2',
  amber500: '#f59e0b',
  amber100: '#fef3c7',
  amber50:  '#fffbeb',
  green500: '#22c55e',
  green100: '#dcfce7',
  green50:  '#f0fdf4',
  bodyFont: "'DM Sans', system-ui, sans-serif",
  serif:    "'DM Serif Display', Georgia, serif",
};

/* ─── Primitives ─────────────────────────────────────────────────────────── */
const card = {
  background: T.white,
  border: `1px solid ${T.slate200}`,
  borderRadius: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
};

const baseInput = {
  width: '100%', background: T.slate50, border: `1.5px solid ${T.slate200}`,
  borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 600,
  color: T.slate900, fontFamily: T.bodyFont, outline: 'none',
  transition: 'border-color .18s, box-shadow .18s, background .18s',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 700, color: T.slate400,
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7,
  fontFamily: T.bodyFont,
};

/* ─── FInput ─────────────────────────────────────────────────────────────── */
function FInput({ label, value, onChange, type = 'text', placeholder, required, rows }) {
  const [focused, setFocused] = useState(false);
  const s = {
    ...baseInput,
    border: `1.5px solid ${focused ? T.blue600 : T.slate200}`,
    background: focused ? T.white : T.slate50,
    boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none',
  };
  const shared = { value, onChange, type, placeholder, required, onFocus: () => setFocused(true), onBlur: () => setFocused(false), style: s };
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      {rows ? <textarea {...shared} rows={rows} style={{ ...s, resize: 'none' }} /> : <input {...shared} />}
    </div>
  );
}

/* ─── FSelect ────────────────────────────────────────────────────────────── */
function FSelect({ label, value, onChange, children }) {
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <select value={value} onChange={onChange} style={{ ...baseInput, appearance: 'none', cursor: 'pointer' }}>
        {children}
      </select>
    </div>
  );
}

/* ─── Buttons ────────────────────────────────────────────────────────────── */
function PrimaryBtn({ onClick, children, type = 'button', disabled, bg = T.blue600, hoverBg = T.blue700, shadow = 'rgba(37,99,235,.28)' }) {
  const [hov, setHov] = useState(false);
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov && !disabled ? hoverBg : bg, color: T.white,
        border: 'none', borderRadius: 12, padding: '11px 22px',
        fontSize: 12, fontWeight: 700, fontFamily: T.bodyFont,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        boxShadow: `0 4px 14px ${shadow}`,
        transform: hov && !disabled ? 'translateY(-1px)' : 'none',
        transition: 'all .18s', letterSpacing: '-.01em',
      }}>
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children, type = 'button' }) {
  const [hov, setHov] = useState(false);
  return (
    <button type={type} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.slate100 : T.white, color: T.slate700,
        border: `1.5px solid ${hov ? T.slate300 : T.slate200}`,
        borderRadius: 12, padding: '11px 20px', fontSize: 12, fontWeight: 600,
        fontFamily: T.bodyFont, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all .18s',
      }}>
      {children}
    </button>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, unit, icon: Icon, trend, color = T.blue600 }) {
  return (
    <motion.div whileHover={{ y: -3 }} style={{ ...card, padding: '20px 22px', cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: trend !== undefined ? 14 : 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: color + '18', border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 19, height: 19, color }} />
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.slate400, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2, fontFamily: T.bodyFont }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: T.slate900, letterSpacing: '-.03em', fontFamily: T.bodyFont }}>{value}</span>
            {unit && <span style={{ fontSize: 10, fontWeight: 700, color: T.slate400, textTransform: 'uppercase' }}>{unit}</span>}
          </div>
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800,
            background: trend >= 0 ? T.green50 : T.rose50,
            color: trend >= 0 ? '#15803d' : T.rose600,
          }}>
            {trend >= 0 ? <ChevronUp style={{ width: 11, height: 11 }} /> : <ChevronDown style={{ width: 11, height: 11 }} />}
            {Math.abs(trend)}%
          </span>
          <span style={{ fontSize: 10, color: T.slate400, fontWeight: 500 }}>vs last shift</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Sidebar item ───────────────────────────────────────────────────────── */
function SidebarItem({ icon: Icon, label, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderRadius: 12, cursor: 'pointer', fontFamily: T.bodyFont,
        background: active ? T.blue600 : hov ? T.slate100 : 'transparent',
        color: active ? T.white : hov ? T.slate900 : T.slate500,
        fontWeight: 700, fontSize: 13,
        boxShadow: active ? '0 4px 12px rgba(37,99,235,.22)' : 'none',
        transition: 'all .18s',
      }}>
      <Icon style={{ width: 17, height: 17 }} />
      <span>{label}</span>
    </div>
  );
}

/* ─── Section divider ────────────────────────────────────────────────────── */
function SectionDiv({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      {Icon && <Icon style={{ width: 13, height: 13, color: T.blue600 }} />}
      <span style={{ fontSize: 11, fontWeight: 700, color: T.slate700, fontFamily: T.bodyFont }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: T.slate200 }} />
    </div>
  );
}

/* ─── Modal shell ────────────────────────────────────────────────────────── */
function ModalShell({ title, subtitle, icon: Icon, accent = T.blue600, onClose, children, maxW = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ scale: .96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: .35, ease: [.22, 1, .36, 1] }}
        style={{ ...card, width: '100%', maxWidth: maxW, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,.07), 0 32px 80px rgba(37,99,235,.09)' }}>
        {/* Accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 3, background: `linear-gradient(90deg,${accent},${accent}80)`, borderRadius: '0 0 6px 6px' }} />
        {/* Header */}
        <div style={{ padding: '28px 32px 22px', borderBottom: `1px solid ${T.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: accent + '16', border: `1.5px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 18, height: 18, color: accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: T.slate900, margin: 0, letterSpacing: '-.02em', fontFamily: T.bodyFont }}>{title}</h2>
              {subtitle && <p style={{ fontSize: 11, color: T.slate400, margin: '2px 0 0', fontWeight: 500 }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: T.slate100, border: `1px solid ${T.slate200}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'} onMouseLeave={e => e.currentTarget.style.background = T.slate100}>
            <X style={{ width: 14, height: 14, color: T.slate500 }} />
          </button>
        </div>
        <div style={{ padding: '26px 32px 32px' }}>{children}</div>
      </motion.div>
    </div>
  );
}

/* ─── Table wrapper ──────────────────────────────────────────────────────── */
function TableWrap({ headers, children }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.bodyFont }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${T.slate100}` }}>
          {headers.map(h => <th key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: T.slate400, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

/* ─── Add Patient Modal ──────────────────────────────────────────────────── */
function AddPatientModal({ isOpen, onClose, onSuccess }) {
  const [fd, setFd] = useState({ first_name: '', last_name: '', dob: '', gender: 'MALE', phone: '', address: '', primary_doctor_id: 1 });
  const set = (k, v) => setFd(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await addPatient(fd); onSuccess(); onClose(); setFd({ first_name: '', last_name: '', dob: '', gender: 'MALE', phone: '', address: '', primary_doctor_id: 1 }); }
    catch (err) { alert(err.response?.data?.error || 'Failed to add patient'); }
  };
  if (!isOpen) return null;
  return (
    <ModalShell title="Patient Registration" subtitle="Create new clinical intake record" icon={UserPlus} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SectionDiv label="Personal Details" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FInput label="First Name" required value={fd.first_name} onChange={e => set('first_name', e.target.value)} />
          <FInput label="Last Name" required value={fd.last_name} onChange={e => set('last_name', e.target.value)} />
          <FInput label="Date of Birth" required type="date" value={fd.dob} onChange={e => set('dob', e.target.value)} />
          <FSelect label="Biological Sex" value={fd.gender} onChange={e => set('gender', e.target.value)}>
            <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
          </FSelect>
        </div>
        <FInput label="Primary Contact Number" required placeholder="+1 (555) 000-0000" value={fd.phone} onChange={e => set('phone', e.target.value)} />
        <FInput label="Residential Address" rows={3} value={fd.address} onChange={e => set('address', e.target.value)} />
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="submit">Register Patient <ArrowRight style={{ width: 14, height: 14 }} /></PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── Add Vitals Modal ───────────────────────────────────────────────────── */
function AddVitalsModal({ isOpen, onClose, onSuccess, patientId }) {
  const [fd, setFd] = useState({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '', glucose_level: '', oxygen_saturation: '' });
  const set = (k, v) => setFd(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await addVitals({ ...fd, patient_id: patientId }); onSuccess(); onClose(); setFd({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '', glucose_level: '', oxygen_saturation: '' }); }
    catch (err) { alert(err.response?.data?.error || 'Failed to record vitals'); }
  };
  if (!isOpen) return null;
  return (
    <ModalShell title="Biometric Capture" subtitle="Synchronise new patient vitals to record" icon={Activity} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SectionDiv label="Blood Pressure" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FInput label="Systolic (mmHg)" required type="number" value={fd.blood_pressure_systolic} onChange={e => set('blood_pressure_systolic', e.target.value)} />
          <FInput label="Diastolic (mmHg)" required type="number" value={fd.blood_pressure_diastolic} onChange={e => set('blood_pressure_diastolic', e.target.value)} />
        </div>
        <SectionDiv label="Other Metrics" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FInput label="Heart Rate (bpm)" required type="number" value={fd.heart_rate} onChange={e => set('heart_rate', e.target.value)} />
          <FInput label="Oxygen Sat (%)" required type="number" value={fd.oxygen_saturation} onChange={e => set('oxygen_saturation', e.target.value)} />
          <FInput label="Temperature (°C)" required type="number" value={fd.temperature} onChange={e => set('temperature', e.target.value)} />
          <FInput label="Glucose (mg/dL)" required type="number" value={fd.glucose_level} onChange={e => set('glucose_level', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="submit"><Zap style={{ width: 14, height: 14 }} /> Save Metrics</PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── Add Availability Modal ─────────────────────────────────────────────── */
function AddAvailabilityModal({ isOpen, onClose, onSuccess, doctorId }) {
  const [fd, setFd] = useState({ date: '', slot_start: '', slot_end: '', max_patients: 1 });
  const set = (k, v) => setFd(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await addDoctorAvailability({ ...fd, doctor_id: doctorId }); onSuccess(); onClose(); setFd({ date: '', slot_start: '', slot_end: '', max_patients: 1 }); }
    catch (err) { alert(err.response?.data?.error || 'Failed to add availability'); }
  };
  if (!isOpen) return null;
  return (
    <ModalShell title="Slot Provisioning" subtitle="Define new availability windows" icon={Calendar} onClose={onClose} maxW={420}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FInput label="Clinical Date" required type="date" value={fd.date} onChange={e => set('date', e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FInput label="Slot Start" required type="time" value={fd.slot_start} onChange={e => set('slot_start', e.target.value)} />
          <FInput label="Slot End" required type="time" value={fd.slot_end} onChange={e => set('slot_end', e.target.value)} />
        </div>
        <FInput label="Max Capacity" required type="number" value={fd.max_patients} onChange={e => set('max_patients', e.target.value)} />
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="submit"><Calendar style={{ width: 14, height: 14 }} /> Provision Slot</PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── Discharge Modal ────────────────────────────────────────────────────── */
function DischargeModal({ isOpen, onClose, onSuccess, patientId, doctorId }) {
  const [fd, setFd] = useState({ consultation_fee: 500, tax_rate: 0.18, discount_rate: 0, notes: '', line_items: [] });
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_price: 0 });
  const addLineItem = () => {
    if (newItem.description) { setFd(f => ({ ...f, line_items: [...f.line_items, newItem] })); setNewItem({ description: '', quantity: 1, unit_price: 0 }); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await dischargePatient(patientId, { ...fd, doctor_id: doctorId }); onSuccess(); onClose(); }
    catch (err) { alert(err.response?.data?.error || 'Discharge failed'); }
  };
  if (!isOpen) return null;
  return (
    <ModalShell title="Discharge & Settlement" subtitle="Finalise clinical case and generate billing record" icon={LogOut} accent={T.rose600} onClose={onClose} maxW={600}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <SectionDiv label="Billing Summary" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <FInput label="Consultation ($)" type="number" value={fd.consultation_fee} onChange={e => setFd(f => ({ ...f, consultation_fee: e.target.value }))} />
          <FInput label="Tax (decimal)" type="number" value={fd.tax_rate} onChange={e => setFd(f => ({ ...f, tax_rate: e.target.value }))} />
          <FInput label="Discount" type="number" value={fd.discount_rate} onChange={e => setFd(f => ({ ...f, discount_rate: e.target.value }))} />
        </div>
        <FInput label="Discharge Notes" rows={2} value={fd.notes} onChange={e => setFd(f => ({ ...f, notes: e.target.value }))} />
        <SectionDiv label="Ancillary Services" />
        <div style={{ background: T.slate50, border: `1px solid ${T.slate200}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input placeholder="Service description" value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} style={{ ...baseInput, flex: 1, padding: '9px 12px', fontSize: 12 }} />
            <input type="number" placeholder="Qty" value={newItem.quantity} onChange={e => setNewItem(n => ({ ...n, quantity: e.target.value }))} style={{ ...baseInput, width: 64, padding: '9px 10px', fontSize: 12 }} />
            <input type="number" placeholder="Price" value={newItem.unit_price} onChange={e => setNewItem(n => ({ ...n, unit_price: e.target.value }))} style={{ ...baseInput, width: 90, padding: '9px 10px', fontSize: 12 }} />
            <button type="button" onClick={addLineItem} style={{ background: T.slate900, color: T.white, border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: T.bodyFont }}>Add</button>
          </div>
          <div style={{ maxHeight: 120, overflowY: 'auto' }}>
            {fd.line_items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.slate200}`, fontSize: 12, color: T.slate600, fontWeight: 600 }}>
                <span>{item.description} (×{item.quantity})</span>
                <span style={{ color: T.slate900, fontWeight: 700 }}>${(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="submit" bg={T.rose600} hoverBg="#be123c" shadow="rgba(225,29,72,.28)">
            <LogOut style={{ width: 14, height: 14 }} /> Execute Discharge
          </PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── Patients View ──────────────────────────────────────────────────────── */
function PatientsView({ patients, onSelect, onAddClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: T.slate900, letterSpacing: '-.03em', margin: 0, fontFamily: T.bodyFont }}>Patient Registry</h2>
          <p style={{ fontSize: 10, color: T.slate400, fontWeight: 700, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{patients.length} active managed patients</p>
        </div>
        <PrimaryBtn onClick={onAddClick}><UserPlus style={{ width: 14, height: 14 }} /> Register Patient</PrimaryBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(276px, 1fr))', gap: 18 }}>
        {patients.map((p, i) => {
          const score = p.health_score || p.ai_health_score || 0;
          const scoreColor = score >= 85 ? '#16a34a' : score >= 65 ? T.amber500 : T.rose600;
          return (
            <motion.div key={i} whileHover={{ y: -4 }}
              style={{ ...card, padding: 22, cursor: 'default', transition: 'border-color .2s, box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue200; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.slate200; e.currentTarget.style.boxShadow = card.boxShadow; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 15, background: T.blue50, border: `1.5px solid ${T.blue100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: T.blue600, flexShrink: 0 }}>
                  {p.first_name?.[0]}{p.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: T.slate900, letterSpacing: '-.02em' }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 10, color: T.slate400, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>MRN #{p.patient_id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.slate400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Health Index</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: scoreColor }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>{score}%</span>
                  </div>
                </div>
                {score < 65 && <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 9, fontWeight: 800, background: T.rose50, color: T.rose600, border: `1px solid ${T.rose100}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</span>}
              </div>
              <div style={{ height: 4, background: T.slate100, borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(score, 100)}%`, background: scoreColor, borderRadius: 99, transition: 'width .8s' }} />
              </div>
              <div style={{ fontSize: 11, color: T.slate400, marginBottom: 16, fontWeight: 500 }}>
                {p.recorded_at ? `Last vitals ${new Date(p.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No vitals recorded'}
              </div>
              <button onClick={() => onSelect(p)}
                style={{ width: '100%', background: T.slate50, border: `1.5px solid ${T.slate200}`, borderRadius: 11, padding: '10px', fontSize: 11, fontWeight: 700, color: T.slate600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .18s', fontFamily: T.bodyFont }}
                onMouseEnter={e => { e.currentTarget.style.background = T.blue600; e.currentTarget.style.color = T.white; e.currentTarget.style.borderColor = T.blue600; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.slate50; e.currentTarget.style.color = T.slate600; e.currentTarget.style.borderColor = T.slate200; }}>
                View Case File <ArrowRight style={{ width: 13, height: 13 }} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Appointments View ──────────────────────────────────────────────────── */
function AppointmentsView({ doctorId = 1, appointments = [] }) {
  const [schedule, setSchedule] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  useEffect(() => { getDoctorSchedule(doctorId).then(setSchedule); }, [doctorId]);
  const refresh = () => getDoctorSchedule(doctorId).then(setSchedule);

  const TRow = ({ children }) => (
    <tr style={{ borderBottom: `1px solid ${T.slate50}` }}
      onMouseEnter={e => e.currentTarget.style.background = T.slate50}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </tr>
  );
  const TD = ({ children, style }) => <td style={{ padding: '13px 16px', ...style }}>{children}</td>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: T.slate900, letterSpacing: '-.03em', margin: 0, fontFamily: T.bodyFont }}>Physician Schedule</h2>
          <p style={{ fontSize: 10, color: T.slate400, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Manage consultation slots & bookings</p>
        </div>
        <PrimaryBtn onClick={() => setIsAddOpen(true)}><Calendar style={{ width: 14, height: 14 }} /> Add Availability</PrimaryBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Active appointments */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.slate100}`, background: T.slate50, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users style={{ width: 14, height: 14, color: T.blue600 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Active Appointments</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <TableWrap headers={['Patient', 'Scheduled', 'Status']}>
              {appointments.map((a, i) => (
                <TRow key={i}>
                  <TD style={{ fontWeight: 700, fontSize: 13, color: T.slate900 }}>{a.first_name} {a.last_name}</TD>
                  <TD style={{ fontSize: 12, color: T.slate500, fontWeight: 500 }}>
                    {new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TD>
                  <TD>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: a.status === 'COMPLETED' ? T.green50 : T.blue50, color: a.status === 'COMPLETED' ? '#15803d' : T.blue600, border: `1px solid ${a.status === 'COMPLETED' ? T.green100 : T.blue100}` }}>
                      {a.status}
                    </span>
                  </TD>
                </TRow>
              ))}
              {appointments.length === 0 && <tr><td colSpan={3} style={{ padding: '48px 20px', textAlign: 'center', color: T.slate300, fontSize: 12, fontWeight: 600 }}>No appointments scheduled</td></tr>}
            </TableWrap>
          </div>
        </div>
        {/* Availability */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.slate100}`, background: T.slate50, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock style={{ width: 14, height: 14, color: T.blue600 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Availability Matrix</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <TableWrap headers={['Date', 'Window', 'Utilisation']}>
              {schedule.map((s, i) => (
                <TRow key={i}>
                  <TD style={{ fontWeight: 700, fontSize: 13, color: T.slate900 }}>{s.available_date}</TD>
                  <TD style={{ fontSize: 12, color: T.slate500 }}>{(s.slot_start || '').slice(0, 5)} – {(s.slot_end || '').slice(0, 5)}</TD>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, maxWidth: 72, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: T.blue600, borderRadius: 99, width: `${(s.booked_patients / s.max_patients) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.slate500 }}>{s.booked_patients}/{s.max_patients}</span>
                    </div>
                  </TD>
                </TRow>
              ))}
              {schedule.length === 0 && <tr><td colSpan={3} style={{ padding: '48px 20px', textAlign: 'center', color: T.slate300, fontSize: 12, fontWeight: 600 }}>No slots provisioned</td></tr>}
            </TableWrap>
          </div>
        </div>
      </div>
      <AddAvailabilityModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={refresh} doctorId={doctorId} />
    </div>
  );
}

/* ─── Clinical assessment notes ──────────────────────────────────────────── */
function clinicalNotes(vitals) {
  if (!vitals) return [];
  const n = [];
  if (vitals.heart_rate > 100) n.push({ type: 'warning', text: `Tachycardia: HR ${vitals.heart_rate} bpm. Monitor for underlying causes.` });
  else if (vitals.heart_rate < 60) n.push({ type: 'warning', text: `Bradycardia: HR ${vitals.heart_rate} bpm. Evaluate medication effects.` });
  else if (vitals.heart_rate) n.push({ type: 'normal', text: `Heart rate normal at ${vitals.heart_rate} bpm.` });
  if (vitals.blood_pressure_systolic > 140) n.push({ type: 'warning', text: `Hypertension: BP ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg.` });
  else if (vitals.blood_pressure_systolic < 90) n.push({ type: 'warning', text: `Hypotension: BP ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg.` });
  else if (vitals.blood_pressure_systolic) n.push({ type: 'normal', text: `BP within range: ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg.` });
  if (vitals.oxygen_saturation < 95) n.push({ type: 'critical', text: `Low SpO₂: ${vitals.oxygen_saturation}%. Supplemental oxygen may be needed.` });
  else if (vitals.oxygen_saturation) n.push({ type: 'normal', text: `SpO₂ normal at ${vitals.oxygen_saturation}%.` });
  if (vitals.temperature > 38) n.push({ type: 'warning', text: `Elevated temperature: ${vitals.temperature}°C. Screen for infection.` });
  if (vitals.glucose_level > 180) n.push({ type: 'warning', text: `Hyperglycaemia: ${vitals.glucose_level} mg/dL.` });
  else if (vitals.glucose_level < 70 && vitals.glucose_level > 0) n.push({ type: 'warning', text: `Hypoglycaemia: ${vitals.glucose_level} mg/dL.` });
  return n;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false);
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    doctor: {}, metrics: { active_patients: 0, high_risk: 0, open_alerts: 0 },
    alerts: { critical: [], high_priority: [] }, today_schedule: []
  });

  const doctorId = localStorage.getItem('user_id') || 1;

  const fetchData = async () => {
    try {
      const data = await getDoctorDashboard(doctorId);
      setDashboardData(data);
      setPatients(data.patients || []);
      setAppointments(data.appointments || []);
      setNotifications((data.alerts.critical || []).slice(0, 10).map(a => ({
        id: a.prediction_id, title: 'Critical Alert',
        message: `${a.name} — risk score ${a.risk_score}`, time: new Date().toLocaleTimeString(), type: 'urgent'
      })));
    } catch (err) {
      console.error("Failed to load doctor dashboard", err);
      // We could set an error state here, but for now we just log it.
      // The finally block ensures the loading spinner stops.
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { if (selectedPatient) { const u = patients.find(p => p.patient_id === selectedPatient.patient_id); if (u) setSelectedPatient(u); } }, [patients]);

  const selectPatient = async (patient) => {
    setSelectedPatient(patient); setPatientDetailLoading(true);
    try { const d = await getPatientDetail(patient.patient_id); setPatientDetail(d); }
    catch { setPatientDetail(null); } finally { setPatientDetailLoading(false); }
  };
  const clearPatient = () => { setSelectedPatient(null); setPatientDetail(null); };

  const docName = dashboardData.doctor.full_name || '';
  const docInitials = docName.split(' ').map(n => n[0]).join('').slice(0, 2);
  const docLast = docName.split(' ').pop();

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.slate50, fontFamily: T.bodyFont }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${T.slate200}`, borderTopColor: T.blue600, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: T.slate400, fontWeight: 600, fontSize: 13 }}>Loading clinical dashboard…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        body{font-family:'DM Sans',system-ui,sans-serif;margin:0;}
        .vc-scroll::-webkit-scrollbar{width:4px;}
        .vc-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:99px;}
        .vc-scroll::-webkit-scrollbar-track{background:transparent;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.35)}}
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: T.slate50, fontFamily: T.bodyFont }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside style={{ width: 260, minWidth: 260, background: T.white, borderRight: `1px solid ${T.slate200}`, display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,.3)' }}>
              <Activity style={{ width: 17, height: 17, color: T.white }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: T.slate900, letterSpacing: '-.03em', lineHeight: 1 }}>Sahara</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: T.blue600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Clinician Portal</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <SidebarItem icon={BarChart2} label="Overview" active={activeTab === 'Overview'} onClick={() => { setActiveTab('Overview'); clearPatient(); }} />
            <SidebarItem icon={Users} label="My Patients" active={activeTab === 'Patients'} onClick={() => { setActiveTab('Patients'); clearPatient(); }} />
            <SidebarItem icon={Calendar} label="Schedule" active={activeTab === 'Appointments'} onClick={() => { setActiveTab('Appointments'); clearPatient(); }} />
          </div>

          {/* Doctor card */}
          <div style={{ marginTop: 16, background: T.slate50, border: `1px solid ${T.slate200}`, borderRadius: 16, padding: 16, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{docInitials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.slate900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {docLast}</div>
                <div style={{ fontSize: 10, color: T.blue600, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dashboardData.doctor.specialization || 'Physician'}</div>
              </div>
            </div>
            <button style={{ width: '100%', background: T.white, border: `1px solid ${T.slate200}`, borderRadius: 9, padding: '8px', fontSize: 11, fontWeight: 700, color: T.slate500, cursor: 'pointer', fontFamily: T.bodyFont, transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = T.slate100} onMouseLeave={e => e.currentTarget.style.background = T.white}>
              Profile Settings
            </button>
          </div>

          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: T.rose600, fontWeight: 700, fontSize: 13, borderRadius: 12, width: '100%', fontFamily: T.bodyFont, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.rose50} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <LogOut style={{ width: 16, height: 16 }} /> Sign Out
          </button>
        </aside>

        {/* ── Main ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <header style={{ height: 66, background: T.white, borderBottom: `1px solid ${T.slate200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', flexShrink: 0, zIndex: 30 }}>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 900, color: T.slate900, letterSpacing: '-.03em', margin: 0 }}>
                {selectedPatient ? 'Patient Analysis' : activeTab === 'Overview' ? 'Clinical Overview' : activeTab === 'Patients' ? 'Patient Registry' : 'Physician Schedule'}
              </h1>
              <p style={{ fontSize: 12, color: T.slate400, margin: 0, fontWeight: 500 }}>
                {selectedPatient ? `Reviewing ${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Real-time clinical monitoring'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: T.slate400 }} />
                <input placeholder="Search patients…" style={{ ...baseInput, paddingLeft: 36, width: 210, fontSize: 12, padding: '9px 14px 9px 36px' }} />
              </div>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)}
                  style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isNotifOpen ? T.blue50 : T.white, border: `1px solid ${isNotifOpen ? T.blue200 : T.slate200}`, cursor: 'pointer', position: 'relative', transition: 'all .15s', color: isNotifOpen ? T.blue600 : T.slate500 }}>
                  <Bell style={{ width: 16, height: 16 }} />
                  {notifications.length > 0 && <span style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, background: T.rose600, borderRadius: '50%', border: `2px solid ${T.white}` }} />}
                </button>
                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .96 }}
                      style={{ position: 'absolute', top: 48, right: 0, width: 316, background: T.white, border: `1px solid ${T.slate200}`, borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,.09)', zIndex: 50, overflow: 'hidden' }}>
                      <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.slate50 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: T.slate900 }}>Active Alerts</span>
                        <button onClick={() => setNotifications([])} style={{ fontSize: 11, fontWeight: 700, color: T.blue600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.bodyFont }}>Clear all</button>
                      </div>
                      <div className="vc-scroll" style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <Shield style={{ width: 28, height: 28, color: T.slate200, margin: '0 auto 10px', display: 'block' }} />
                            <p style={{ fontSize: 12, color: T.slate400, fontWeight: 600 }}>System baseline nominal</p>
                          </div>
                        ) : notifications.map(n => (
                          <div key={n.id} style={{ padding: '12px 18px', borderBottom: `1px solid ${T.slate50}`, cursor: 'pointer', transition: 'background .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = T.slate50} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: n.type === 'urgent' ? T.rose600 : T.slate900 }}>{n.title}</span>
                              <span style={{ fontSize: 10, color: T.slate400 }}>{n.time}</span>
                            </div>
                            <p style={{ fontSize: 12, color: T.slate500, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Avatar */}
              <div style={{ width: 40, height: 40, background: T.blue50, border: `1px solid ${T.blue100}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: T.blue600, flexShrink: 0 }}>
                {docLast?.[0]}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="vc-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── OVERVIEW ────────────────────────────────────────────── */}
            {activeTab === 'Overview' && !selectedPatient && (
              <>
                {/* Metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                  <StatCard label="Active Patients" value={dashboardData.metrics.active_patients} icon={Users} trend={2.5} color="#6366f1" />
                  <StatCard label="High Risk" value={dashboardData.metrics.high_risk} icon={Zap} trend={-1.2} color={T.amber500} />
                  <StatCard label="Open Alerts" value={dashboardData.alerts.critical.length} icon={Bell} color={T.rose600} />
                </div>

                {/* Alerts row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Critical */}
                  <div style={{ ...card, overflow: 'hidden' }}>
                    <div style={{ padding: '15px 20px', borderBottom: `1px solid ${T.rose100}`, background: T.rose50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.rose600, display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#9f1239' }}>Critical Alerts</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: T.rose600, background: T.rose100, border: `1px solid ${T.rose100}`, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dashboardData.alerts.critical.length} critical</span>
                    </div>
                    <div className="vc-scroll" style={{ maxHeight: 440, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {dashboardData.alerts.critical.length === 0 ? (
                        <div style={{ padding: '48px 0', textAlign: 'center' }}>
                          <Shield style={{ width: 32, height: 32, color: T.slate200, margin: '0 auto 10px', display: 'block' }} />
                          <p style={{ fontSize: 12, color: T.slate400, fontWeight: 600 }}>No active critical alerts</p>
                        </div>
                      ) : dashboardData.alerts.critical.map(alert => (
                        <div key={alert.prediction_id}
                          style={{ background: T.white, border: `1.5px solid ${T.rose100}`, borderRadius: 14, padding: '16px', transition: 'box-shadow .15s' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(225,29,72,.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14, color: T.slate900 }}>{alert.name}</div>
                              <div style={{ fontSize: 10, color: T.slate400, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID #{alert.patient_id} · Ward {alert.ward || 'N/A'}</div>
                            </div>
                            <span style={{ background: T.rose600, color: T.white, padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800 }}>Risk {alert.risk_score}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                            {[['SpO₂', `${alert.spo2}%`, alert.spo2 < 95], ['Heart Rate', alert.heart_rate, alert.heart_rate > 100], ['BP Sys', alert.bp_sys, false]].map(([l, v, warn]) => (
                              <div key={l} style={{ background: T.slate50, border: `1px solid ${T.slate200}`, borderRadius: 10, padding: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{l}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: warn ? T.rose600 : T.slate900 }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={async () => { await acknowledgeAlert(alert.prediction_id); fetchData(); }}
                              style={{ flex: 1, background: T.rose600, color: T.white, border: 'none', borderRadius: 10, padding: '9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: T.bodyFont, transition: 'background .15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#be123c'} onMouseLeave={e => e.currentTarget.style.background = T.rose600}>
                              Acknowledge
                            </button>
                            <button onClick={() => { const [fn, ...r] = (alert.name || 'Patient').split(' '); selectPatient({ patient_id: alert.patient_id, first_name: fn, last_name: r.join(' ') }); }}
                              style={{ padding: '9px 14px', background: T.white, border: `1.5px solid ${T.slate200}`, borderRadius: 10, fontSize: 11, fontWeight: 700, color: T.slate600, cursor: 'pointer', fontFamily: T.bodyFont, transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue200; e.currentTarget.style.color = T.blue600; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = T.slate200; e.currentTarget.style.color = T.slate600; }}>
                              Profile
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High priority */}
                  <div style={{ ...card, overflow: 'hidden' }}>
                    <div style={{ padding: '15px 20px', borderBottom: `1px solid ${T.amber100}`, background: T.amber50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.amber500, display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>High Priority</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: T.amber500, background: T.amber100, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dashboardData.alerts.high_priority.length} priority</span>
                    </div>
                    <div className="vc-scroll" style={{ maxHeight: 440, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {dashboardData.alerts.high_priority.length === 0 ? (
                        <div style={{ padding: '48px 0', textAlign: 'center' }}>
                          <CheckCircle style={{ width: 32, height: 32, color: T.slate200, margin: '0 auto 10px', display: 'block' }} />
                          <p style={{ fontSize: 12, color: T.slate400, fontWeight: 600 }}>All priority cases stable</p>
                        </div>
                      ) : dashboardData.alerts.high_priority.map(alert => (
                        <div key={alert.prediction_id}
                          style={{ background: T.white, border: `1.5px solid ${T.amber100}`, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow .15s' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: T.amber50, border: `1.5px solid ${T.amber100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: T.amber500, flexShrink: 0 }}>
                              {alert.risk_score}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: T.slate900 }}>{alert.name}</div>
                              <div style={{ fontSize: 10, color: T.slate400, fontWeight: 600, marginTop: 2 }}>ID #{alert.patient_id} · {alert.trend_message}</div>
                            </div>
                          </div>
                          <button onClick={() => { const [fn, ...r] = (alert.name || 'Patient').split(' '); selectPatient({ patient_id: alert.patient_id, first_name: fn, last_name: r.join(' ') }); }}
                            style={{ width: 34, height: 34, borderRadius: 10, background: T.slate50, border: `1px solid ${T.slate200}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.slate400, transition: 'all .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = T.blue600; e.currentTarget.style.color = T.white; e.currentTarget.style.borderColor = T.blue600; }}
                            onMouseLeave={e => { e.currentTarget.style.background = T.slate50; e.currentTarget.style.color = T.slate400; e.currentTarget.style.borderColor = T.slate200; }}>
                            <ArrowRight style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's schedule */}
                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ padding: '15px 22px', borderBottom: `1px solid ${T.slate100}`, background: T.slate50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Calendar style={{ width: 15, height: 15, color: T.blue600 }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Today's Schedule</span>
                    </div>
                    <button onClick={() => setActiveTab('Appointments')} style={{ fontSize: 12, fontWeight: 700, color: T.blue600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.bodyFont }}>
                      Expand <ArrowRight style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <TableWrap headers={['Time', 'Patient', 'Reason', 'Status', '']}>
                      {dashboardData.today_schedule.map((appt, idx) => {
                        const isNext = idx === 0 && appt.status === 'SCHEDULED';
                        const isUrgent = (appt.reason || '').toLowerCase().includes('urgent') || (appt.reason || '').toLowerCase().includes('emergency');
                        return (
                          <tr key={appt.appointment_id}
                            style={{ borderBottom: `1px solid ${T.slate50}`, background: isNext ? T.blue50 : 'transparent', transition: 'background .15s' }}
                            onMouseEnter={e => { if (!isNext) e.currentTarget.style.background = T.slate50; }}
                            onMouseLeave={e => { if (!isNext) e.currentTarget.style.background = 'transparent'; }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 9, background: isNext ? T.blue600 : T.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Clock style={{ width: 13, height: 13, color: isNext ? T.white : T.slate400 }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>
                                  {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: T.slate900 }}>{appt.patient_name}</div>
                              <div style={{ fontSize: 10, color: T.slate400, fontWeight: 700 }}>MRN #{appt.patient_id}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: isUrgent ? T.rose50 : T.slate100, color: isUrgent ? T.rose600 : T.slate600, border: `1px solid ${isUrgent ? T.rose100 : T.slate200}` }}>
                                {appt.reason || 'General Follow-up'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: appt.status === 'COMPLETED' ? T.green500 : appt.status === 'CANCELLED' ? T.slate300 : T.blue600, display: 'inline-block', ...(appt.status === 'SCHEDULED' ? { animation: 'pulse-dot 2s infinite' } : {}) }} />
                                <span style={{ fontSize: 11, fontWeight: 800, color: appt.status === 'COMPLETED' ? '#15803d' : appt.status === 'CANCELLED' ? T.slate400 : T.blue600 }}>{appt.status}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <button onClick={() => { const [fn, ...r] = (appt.patient_name || '').split(' '); selectPatient({ patient_id: appt.patient_id, first_name: fn, last_name: r.join(' ') }); }}
                                style={{ background: T.white, border: `1.5px solid ${T.slate200}`, borderRadius: 10, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: T.slate600, cursor: 'pointer', fontFamily: T.bodyFont, transition: 'all .18s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = T.blue600; e.currentTarget.style.color = T.white; e.currentTarget.style.borderColor = T.blue600; }}
                                onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.color = T.slate600; e.currentTarget.style.borderColor = T.slate200; }}>
                                {isNext ? 'Launch Session' : 'Review Chart'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {dashboardData.today_schedule.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: '52px 0', textAlign: 'center' }}>
                          <Clock style={{ width: 28, height: 28, color: T.slate200, margin: '0 auto 10px', display: 'block' }} />
                          <p style={{ fontSize: 12, color: T.slate300, fontWeight: 600 }}>No consultations today</p>
                        </td></tr>
                      )}
                    </TableWrap>
                  </div>
                </div>
              </>
            )}

            {/* ── PATIENTS ────────────────────────────────────────────── */}
            {activeTab === 'Patients' && !selectedPatient && (
              <PatientsView patients={patients} onSelect={selectPatient} onAddClick={() => setIsAddPatientOpen(true)} />
            )}

            {/* ── APPOINTMENTS ────────────────────────────────────────── */}
            {activeTab === 'Appointments' && (
              <AppointmentsView doctorId={doctorId} appointments={appointments} />
            )}

            {/* ── PATIENT DETAIL ──────────────────────────────────────── */}
            <AnimatePresence>
              {selectedPatient && (
                <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .35 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {patientDetailLoading ? (
                    <div style={{ ...card, padding: '60px', textAlign: 'center', color: T.slate400, fontSize: 13 }}>Loading patient details…</div>
                  ) : (
                    <>
                      {/* Patient header */}
                      <div style={{ ...card, padding: '26px 30px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.blue600},${T.blue500}80)` }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontSize: 24, fontWeight: 900, boxShadow: '0 8px 24px rgba(37,99,235,.3)', flexShrink: 0 }}>
                              {selectedPatient.first_name?.[0]}{selectedPatient.last_name?.[0]}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <h2 style={{ fontSize: 24, fontWeight: 900, color: T.slate900, letterSpacing: '-.03em', margin: 0, fontFamily: T.bodyFont }}>{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                                <span style={{ background: T.blue50, color: T.blue600, border: `1px solid ${T.blue100}`, borderRadius: 99, padding: '3px 12px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Case</span>
                              </div>
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {[
                                  { icon: Shield, text: `MRN #${selectedPatient.patient_id}` },
                                  { icon: Users, text: patientDetail?.patient?.gender || '—' },
                                  { icon: Calendar, text: patientDetail?.patient?.dob ? new Date(patientDetail.patient.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A' },
                                  { icon: Phone, text: patientDetail?.patient?.phone || 'No contact' },
                                ].map(({ icon: Ico, text }) => (
                                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.slate50, border: `1px solid ${T.slate200}`, borderRadius: 9, padding: '5px 12px' }}>
                                    <Ico style={{ width: 11, height: 11, color: T.slate400 }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: T.slate700 }}>{text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <GhostBtn onClick={() => {
                              const v = patientDetail?.latest_vitals || selectedPatient;
                              const pr = patientDetail?.predictions?.[0];
                              const blob = new Blob([`CLINICAL REPORT\n${'='.repeat(40)}\nPatient: ${selectedPatient.first_name} ${selectedPatient.last_name}\nMRN: #${selectedPatient.patient_id}\nDate: ${new Date().toLocaleString()}\n\nVITALS:\n  HR: ${v?.heart_rate || 'N/A'} bpm\n  BP: ${v?.blood_pressure_systolic || 'N/A'}/${v?.blood_pressure_diastolic || 'N/A'} mmHg\n  SpO2: ${v?.oxygen_saturation || 'N/A'}%\n  Temp: ${v?.temperature || 'N/A'}°C\n  Glucose: ${v?.glucose_level || 'N/A'} mg/dL\n\nRISK: ${pr?.score || 'N/A'}/100 (${pr?.risk_level || 'N/A'})\n\nGenerated by Sahara Hospital`], { type: 'text/plain' });
                              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `report_${selectedPatient.last_name}.txt`; a.click();
                            }}>
                              <FileText style={{ width: 14, height: 14 }} /> Download Chart
                            </GhostBtn>
                            <PrimaryBtn onClick={() => setIsAddVitalsOpen(true)}>
                              <Zap style={{ width: 14, height: 14 }} /> Record Vitals
                            </PrimaryBtn>
                            <PrimaryBtn onClick={() => setIsDischargeOpen(true)} bg={T.rose600} hoverBg="#be123c" shadow="rgba(225,29,72,.28)">
                              <LogOut style={{ width: 14, height: 14 }} /> Discharge
                            </PrimaryBtn>
                            <button onClick={clearPatient}
                              style={{ width: 40, height: 40, background: T.slate100, border: `1px solid ${T.slate200}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.slate500, transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = T.rose50; e.currentTarget.style.color = T.rose600; }}
                              onMouseLeave={e => { e.currentTarget.style.background = T.slate100; e.currentTarget.style.color = T.slate500; }}>
                              <X style={{ width: 15, height: 15 }} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Vitals grid */}
                      {(() => {
                        const v = patientDetail?.latest_vitals || selectedPatient;
                        const vc = (val, lo, hi) => (val < lo || val > hi) ? T.rose600 : T.blue600;
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 14 }}>
                            <StatCard label="Heart Rate" value={v?.heart_rate || '—'} unit="bpm" icon={Heart} color={vc(v?.heart_rate || 75, 60, 100)} />
                            <StatCard label="SpO₂" value={v?.oxygen_saturation || '—'} unit="%" icon={Activity} color={vc(v?.oxygen_saturation || 98, 95, 101)} />
                            <StatCard label="BP Systolic" value={v?.blood_pressure_systolic || '—'} unit="mmHg" icon={TrendingUp} color={vc(v?.blood_pressure_systolic || 120, 90, 140)} />
                            <StatCard label="BP Diastolic" value={v?.blood_pressure_diastolic || '—'} unit="mmHg" icon={TrendingUp} color={vc(v?.blood_pressure_diastolic || 80, 60, 90)} />
                            <StatCard label="Temperature" value={v?.temperature || '—'} unit="°C" icon={Thermometer} color={vc(v?.temperature || 37, 36, 38)} />
                            <StatCard label="Glucose" value={v?.glucose_level || '—'} unit="mg/dL" icon={Zap} color={vc(v?.glucose_level || 100, 70, 180)} />
                          </div>
                        );
                      })()}

                      {/* Chart + Assessment */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                        {/* Chart */}
                        <div style={{ ...card, padding: '24px 28px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                            <div>
                              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.slate900, margin: 0, letterSpacing: '-.02em' }}>Biometric Trajectory</h3>
                              <p style={{ fontSize: 11, color: T.slate400, margin: '4px 0 0', fontWeight: 500 }}>Historical vitals trend</p>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                              {[{ color: T.rose600, label: 'Heart Rate' }, { color: T.blue600, label: 'SpO₂' }].map(({ color, label }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.slate50, border: `1px solid ${T.slate200}`, borderRadius: 9, padding: '5px 12px' }}>
                                  <div style={{ width: 20, height: 3, background: color, borderRadius: 99 }} />
                                  <span style={{ fontSize: 10, fontWeight: 700, color: T.slate500 }}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {patientDetail?.vitals_history?.length > 0 ? (
                            <div style={{ height: 270 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[...patientDetail.vitals_history].reverse().map(v => ({
                                  time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                  hr: v.heart_rate, spo2: v.oxygen_saturation
                                }))}>
                                  <defs>
                                    <linearGradient id="gHr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.rose600} stopOpacity={0.1} /><stop offset="95%" stopColor={T.rose600} stopOpacity={0} /></linearGradient>
                                    <linearGradient id="gSpo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue600} stopOpacity={0.1} /><stop offset="95%" stopColor={T.blue600} stopOpacity={0} /></linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.slate100} />
                                  <XAxis dataKey="time" tick={{ fill: T.slate400, fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                  <YAxis tick={{ fill: T.slate400, fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                  <Tooltip contentStyle={{ background: T.white, border: `1px solid ${T.slate200}`, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,.07)', fontSize: 12, fontFamily: T.bodyFont }} />
                                  <Area type="monotone" dataKey="hr" stroke={T.rose600} strokeWidth={2.5} fill="url(#gHr)" name="HR (bpm)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                  <Area type="monotone" dataKey="spo2" stroke={T.blue600} strokeWidth={2.5} fill="url(#gSpo)" name="SpO₂ (%)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div style={{ height: 270, background: T.slate50, borderRadius: 14, border: `2px dashed ${T.slate200}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <Activity style={{ width: 30, height: 30, color: T.slate200, marginBottom: 10 }} />
                              <p style={{ fontSize: 12, color: T.slate400, fontWeight: 600 }}>No vitals history recorded</p>
                            </div>
                          )}
                        </div>

                        {/* AI Notes */}
                        <div style={{ ...card, padding: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                            <Stethoscope style={{ width: 14, height: 14, color: T.blue600 }} />
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: T.slate900, margin: 0 }}>AI Clinical Notes</h3>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(() => {
                              const notes = clinicalNotes(patientDetail?.latest_vitals || selectedPatient);
                              if (!notes.length) return <div style={{ padding: 24, background: T.slate50, borderRadius: 12, textAlign: 'center' }}><p style={{ fontSize: 11, color: T.slate400, fontWeight: 600 }}>Insufficient vitals for assessment</p></div>;
                              return notes.map((note, i) => {
                                const cfg = note.type === 'critical' ? { bg: T.rose50, border: T.rose100, dot: T.rose600, text: '#991b1b' }
                                  : note.type === 'warning' ? { bg: T.amber50, border: T.amber100, dot: T.amber500, text: '#92400e' }
                                  : { bg: T.green50, border: T.green100, dot: T.green500, text: '#15803d' };
                                return (
                                  <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 11, padding: '11px 13px', display: 'flex', gap: 9 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, marginTop: 4, flexShrink: 0 }} />
                                    <p style={{ fontSize: 11, color: cfg.text, margin: 0, fontWeight: 600, lineHeight: 1.6 }}>{note.text}</p>
                                  </div>
                                );
                              });
                            })()}
                            {patientDetail?.predictions?.length > 0 && (
                              <div style={{ marginTop: 8, paddingTop: 14, borderTop: `1px solid ${T.slate200}` }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Risk history</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {patientDetail.predictions.slice(0, 5).map((p, i) => (
                                    <span key={i} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: p.risk_level === 'HIGH' ? T.rose50 : p.risk_level === 'MEDIUM' ? T.amber50 : T.green50, color: p.risk_level === 'HIGH' ? T.rose600 : p.risk_level === 'MEDIUM' ? T.amber500 : '#15803d', border: `1px solid ${p.risk_level === 'HIGH' ? T.rose100 : p.risk_level === 'MEDIUM' ? T.amber100 : T.green100}` }}>
                                      {Math.round(p.score)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Appointment history */}
                      {patientDetail?.appointments?.length > 0 && (
                        <div style={{ ...card, overflow: 'hidden' }}>
                          <div style={{ padding: '15px 20px', borderBottom: `1px solid ${T.slate100}`, background: T.slate50, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Clock style={{ width: 14, height: 14, color: T.blue600 }} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Appointment History</span>
                          </div>
                          <TableWrap headers={['Date', 'Physician', 'Reason', 'Status']}>
                            {patientDetail.appointments.map((a, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid ${T.slate50}`, transition: 'background .15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = T.slate50} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 13, color: T.slate900 }}>{new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td style={{ padding: '13px 16px', fontSize: 12, color: T.slate600 }}>Dr. {a.doctor_name || 'N/A'}</td>
                                <td style={{ padding: '13px 16px', fontSize: 12, color: T.slate500 }}>{a.reason || 'General Consultation'}</td>
                                <td style={{ padding: '13px 16px' }}>
                                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', background: a.status === 'COMPLETED' ? T.green50 : T.blue50, color: a.status === 'COMPLETED' ? '#15803d' : T.blue600, border: `1px solid ${a.status === 'COMPLETED' ? T.green100 : T.blue100}` }}>{a.status}</span>
                                </td>
                              </tr>
                            ))}
                          </TableWrap>
                        </div>
                      )}

                      {/* Billing */}
                      {patientDetail?.billing?.length > 0 && (
                        <div style={{ ...card, padding: '24px 28px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                            <FileText style={{ width: 14, height: 14, color: '#16a34a' }} />
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: T.slate900, margin: 0 }}>Financial Summary</h3>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
                            {patientDetail.billing.map((b, i) => (
                              <div key={i} style={{ background: T.slate50, border: `1.5px solid ${T.slate200}`, borderRadius: 14, padding: '16px 18px', transition: 'border-color .15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = T.green100} onMouseLeave={e => e.currentTarget.style.borderColor = T.slate200}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: T.slate900, letterSpacing: '-.03em', marginBottom: 4 }}>${b.total_amount}</div>
                                <div style={{ fontSize: 11, color: T.slate400, fontWeight: 600, marginBottom: 10 }}>{new Date(b.billed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', background: b.status === 'PAID' ? T.green50 : T.amber50, color: b.status === 'PAID' ? '#15803d' : '#b45309', border: `1px solid ${b.status === 'PAID' ? T.green100 : T.amber100}` }}>{b.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal isOpen={isAddPatientOpen} onClose={() => setIsAddPatientOpen(false)} onSuccess={fetchData} />
      <AddVitalsModal isOpen={isAddVitalsOpen} onClose={() => setIsAddVitalsOpen(false)} patientId={selectedPatient?.patient_id} onSuccess={fetchData} />
      <DischargeModal isOpen={isDischargeOpen} onClose={() => setIsDischargeOpen(false)} onSuccess={() => { clearPatient(); fetchData(); }} patientId={selectedPatient?.patient_id} doctorId={doctorId} />
    </>
  );
};

export default DoctorDashboard;