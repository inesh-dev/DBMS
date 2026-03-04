import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  Heart, 
  Thermometer, 
  Zap, 
  Bell, 
  Search,
  ChevronUp,
  ChevronDown,
  Clock,
  ArrowRight,
  FileText,
  UserPlus,
  LogOut
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getDoctorDashboard,
  getDoctorSchedule,
  addPatient,
  addVitals,
  addDoctorAvailability,
  dischargePatient,
  acknowledgeAlert,
  getPatientDetail
} from '../api';

// --- Utility Components ---
const StatCard = ({ label, value, unit, icon: Icon, trend, color }) => (
  <motion.div whileHover={{ scale: 1.02 }} className="glass-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <span className="stat-label">{label}</span>
        <div className="stat-value" style={{ color: color }}>
          {value}<span style={{ fontSize: '1rem', marginLeft: '4px', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
      <div style={{ background: `${color}20`, padding: '10px', borderRadius: '12px' }}>
        <Icon size={24} color={color} />
      </div>
    </div>
    {trend && (
      <div className="stat-trend" style={{ color: trend > 0 ? 'var(--success)' : 'var(--danger)' }}>
        {trend > 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>{Math.abs(trend)}% from last reading</span>
      </div>
    )}
  </motion.div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div className={`nav-link ${active ? 'active' : ''}`} onClick={onClick}>
    <Icon size={20} />
    <span style={{ fontWeight: 500 }}>{label}</span>
  </div>
);

const AddPatientModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: 'MALE',
    phone: '',
    address: '',
    primary_doctor_id: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addPatient(formData);
      onSuccess();
      onClose();
      setFormData({ first_name: '', last_name: '', dob: '', gender: 'MALE', phone: '', address: '', primary_doctor_id: 1 });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add patient');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Register New Patient</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>First Name</label>
              <input required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last Name</label>
              <input required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date of Birth</label>
            <input required type="date" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gender</label>
            <select style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone</label>
            <input required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address</label>
            <textarea style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', resize: 'none' }} rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Register Patient</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AddVitalsModal = ({ isOpen, onClose, onSuccess, patientId }) => {
  const [formData, setFormData] = useState({
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    glucose_level: '',
    oxygen_saturation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addVitals({ ...formData, patient_id: patientId });
      onSuccess();
      onClose();
      setFormData({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '', glucose_level: '', oxygen_saturation: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record vitals');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Record Vitals</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Heart Rate (bpm)</label>
              <input type="number" step="1" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.heart_rate} onChange={e => setFormData({...formData, heart_rate: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Oxygen (%)</label>
              <input type="number" step="0.1" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.oxygen_saturation} onChange={e => setFormData({...formData, oxygen_saturation: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>BP Systolic</label>
              <input type="number" step="1" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.blood_pressure_systolic} onChange={e => setFormData({...formData, blood_pressure_systolic: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>BP Diastolic</label>
              <input type="number" step="1" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.blood_pressure_diastolic} onChange={e => setFormData({...formData, blood_pressure_diastolic: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Temperature (°C)</label>
              <input type="number" step="0.1" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Glucose (mg/dL)</label>
              <input type="number" step="0.1" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.glucose_level} onChange={e => setFormData({...formData, glucose_level: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Save Vitals</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AddAvailabilityModal = ({ isOpen, onClose, onSuccess, doctorId }) => {
  const [formData, setFormData] = useState({
    date: '',
    slot_start: '',
    slot_end: '',
    max_patients: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoctorAvailability({ ...formData, doctor_id: doctorId });
      onSuccess();
      onClose();
      setFormData({ date: '', slot_start: '', slot_end: '', max_patients: 1 });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add availability');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Set Availability</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</label>
            <input required type="date" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start Time</label>
              <input required type="time" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.slot_start} onChange={e => setFormData({...formData, slot_start: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>End Time</label>
              <input required type="time" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.slot_end} onChange={e => setFormData({...formData, slot_end: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max Patients</label>
            <input required type="number" min="1" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.max_patients} onChange={e => setFormData({...formData, max_patients: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Add Slot</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DischargeModal = ({ isOpen, onClose, onSuccess, patientId, doctorId }) => {
  const [formData, setFormData] = useState({
    consultation_fee: 500,
    tax_rate: 0.18,
    discount_rate: 0,
    notes: '',
    line_items: []
  });

  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_price: 0 });

  const addLineItem = () => {
    if (newItem.description) {
      setFormData({ ...formData, line_items: [...formData.line_items, newItem] });
      setNewItem({ description: '', quantity: 1, unit_price: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dischargePatient(patientId, { ...formData, doctor_id: doctorId });
      alert('Patient discharged and billing generated.');
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Discharge failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Discharge Patient & Generate Bill</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultation Fee ($)</label>
              <input type="number" step="0.01" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.consultation_fee} onChange={e => setFormData({...formData, consultation_fee: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tax Rate (e.g. 0.18)</label>
              <input type="number" step="0.01" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Discount Rate (e.g. 0.1)</label>
              <input type="number" step="0.01" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={formData.discount_rate} onChange={e => setFormData({...formData, discount_rate: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Discharge Notes</label>
            <textarea style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', resize: 'none' }} rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          
          <div style={{ border: '1px solid var(--border)', padding: '15px', borderRadius: '12px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>Additional Services/Items</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input placeholder="Description" style={{ flex: 2, padding: '8px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
              <input type="number" placeholder="Qty" style={{ flex: 0.5, padding: '8px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
              <input type="number" placeholder="Price" style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} value={newItem.unit_price} onChange={e => setNewItem({...newItem, unit_price: e.target.value})} />
              <button type="button" onClick={addLineItem} style={{ padding: '8px 15px', borderRadius: '6px', background: 'var(--secondary)', border: 'none', color: 'white', cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
               {formData.line_items.map((item, idx) => (
                 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{item.description} (x{item.quantity})</span>
                    <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                 </div>
               ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--success)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Confirm Discharge</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const PatientsView = ({ patients, onSelect, onRefresh, onAddClick }) => {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Active Patients</h2>
        <button 
          onClick={onAddClick}
          className="glass-card" 
          style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', border: 'none', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}
        >
          <UserPlus size={18} /> Add New Patient
        </button>
      </div>

      <div className="vitals-grid">
      {patients.map((p, i) => (
        <motion.div key={i} whileHover={{ y: -5 }} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', position: 'relative' }}>
              {p.first_name?.[0] || ''}{p.last_name?.[0] || ''}
              {(p.health_score !== undefined || p.ai_health_score !== undefined) && (
                <div 
                  title={`AI Health Score: ${p.health_score || p.ai_health_score}`}
                  style={{ position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderRadius: '50%', background: (p.health_score || p.ai_health_score) >= 90 ? 'var(--success)' : (p.health_score || p.ai_health_score) >= 70 ? '#eab308' : 'var(--danger)', border: '2px solid var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'white' }}
                >
                  {p.health_score || p.ai_health_score}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {p.patient_id}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {p.recorded_at ? `Last activity: ${new Date(p.recorded_at).toLocaleTimeString()}` : 'No vitals recorded yet'}
            </div>
            {(p.health_score || p.ai_health_score) < 70 && (
                <span className="badge badge-high" style={{ fontSize: '0.7rem' }}>High Risk</span>
            )}
          </div>
          <button 
            onClick={() => onSelect(p)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
          >
            {p.recorded_at ? 'Clinical History' : 'Patient Details'} <ArrowRight size={16} />
          </button>
        </motion.div>
      ))}
    </div>
  </div>
);
};

const AppointmentsView = ({ doctorId = 1, appointments = [] }) => {
  const [schedule, setSchedule] = useState([]);
  const [isAddAvailabilityOpen, setIsAddAvailabilityOpen] = useState(false);

  const refreshSchedule = () => {
    getDoctorSchedule(doctorId).then(setSchedule);
  };

  useEffect(() => {
    refreshSchedule();
  }, [doctorId]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>My Appointments</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setIsAddAvailabilityOpen(true)}
              className="glass-card" 
              style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', border: 'none', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}
            >
              <Calendar size={18} /> Set Availability
            </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '0' }}>
           <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Patient Bookings</h3>
           </div>
           <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 20px' }}>Patient</th>
                    <th style={{ padding: '15px 20px' }}>Time</th>
                    <th style={{ padding: '15px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a, i) => (
                    <tr key={i} style={{ borderBottom: i !== appointments.length -1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '15px 20px' }}>{a.first_name} {a.last_name}</td>
                      <td style={{ padding: '15px 20px', fontWeight: 500 }}>{new Date(a.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span className={`badge ${a.status === 'COMPLETED' ? 'badge-low' : 'badge-high'}`} style={{ fontSize: '0.7rem' }}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No appointments found</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        <div className="glass-card" style={{ padding: '0' }}>
           <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>My Availability Slots</h3>
           </div>
           <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 20px' }}>Date</th>
                    <th style={{ padding: '15px 20px' }}>Slot</th>
                    <th style={{ padding: '15px 20px' }}>Fill</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((s, i) => (
                    <tr key={i} style={{ borderBottom: i !== schedule.length -1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '15px 20px' }}>{s.available_date}</td>
                      <td style={{ padding: '15px 20px', fontWeight: 500 }}>{(s.slot_start || '').slice(0,5)} - {(s.slot_end || '').slice(0,5)}</td>
                      <td style={{ padding: '15px 20px' }}>
                         <div style={{ width: '60px', height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                            <div style={{ width: `${(s.booked_patients / s.max_patients) * 100}%`, height: '100%', background: 'var(--primary)' }} />
                         </div>
                         <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.booked_patients}/{s.max_patients}</span>
                      </td>
                    </tr>
                  ))}
                   {schedule.length === 0 && (
                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No availability slots set</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
      <AddAvailabilityModal 
        isOpen={isAddAvailabilityOpen} 
        onClose={() => setIsAddAvailabilityOpen(false)} 
        onSuccess={refreshSchedule} 
        doctorId={doctorId}
      />
    </div>
  );
};

// --- Main App ---
const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [highRisk, setHighRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false);
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    doctor: {},
    metrics: { active_patients: 0, high_risk: 0, open_alerts: 0, today_revenue: 0 },
    alerts: { critical: [], high_priority: [] },
    today_schedule: []
  });

  const doctorId = localStorage.getItem('user_id') || 1;

  const fetchData = async () => {
    try {
      const data = await getDoctorDashboard(doctorId);
      setDashboardData(data);
      setPatients(data.patients || []);
      setAppointments(data.appointments || []);
      
      // Sync notifications with critical alerts
      const newAlerts = data.alerts.critical.map(a => ({
          id: a.prediction_id,
          title: 'Critical Alert',
          message: `${a.name} has a risk score of ${a.risk_score}!`,
          time: new Date().toLocaleTimeString(),
          type: 'urgent'
      }));
      setNotifications(newAlerts.slice(0, 10));
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find(p => p.patient_id === selectedPatient.patient_id);
      if (updated) setSelectedPatient(updated);
    }
  }, [patients]);

  // Fetch full patient detail when a patient is selected
  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientDetailLoading(true);
    try {
      const detail = await getPatientDetail(patient.patient_id);
      setPatientDetail(detail);
    } catch (err) {
      console.error('Failed to load patient detail:', err);
      setPatientDetail(null);
    } finally {
      setPatientDetailLoading(false);
    }
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientDetail(null);
  };

  const generateClinicalAssessment = (vitals) => {
    if (!vitals) return [];
    const notes = [];
    if (vitals.heart_rate > 100) notes.push({ type: 'warning', text: `Tachycardia detected: HR ${vitals.heart_rate} bpm. Monitor for underlying causes.` });
    else if (vitals.heart_rate < 60) notes.push({ type: 'warning', text: `Bradycardia detected: HR ${vitals.heart_rate} bpm. Evaluate medication effects.` });
    else notes.push({ type: 'normal', text: `Heart rate normal at ${vitals.heart_rate} bpm.` });

    if (vitals.blood_pressure_systolic > 140) notes.push({ type: 'warning', text: `Hypertension: BP ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg. Recommend sodium reduction and follow-up.` });
    else if (vitals.blood_pressure_systolic < 90) notes.push({ type: 'warning', text: `Hypotension: BP ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg. Monitor for dizziness.` });
    else notes.push({ type: 'normal', text: `Blood pressure within range: ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg.` });

    if (vitals.oxygen_saturation < 95) notes.push({ type: 'critical', text: `Low SpO₂: ${vitals.oxygen_saturation}%. Supplemental oxygen may be needed.` });
    else notes.push({ type: 'normal', text: `Oxygen saturation normal at ${vitals.oxygen_saturation}%.` });

    if (vitals.temperature > 38) notes.push({ type: 'warning', text: `Elevated temperature: ${vitals.temperature}°C. Screen for infection.` });
    if (vitals.glucose_level > 180) notes.push({ type: 'warning', text: `Hyperglycemia: ${vitals.glucose_level} mg/dL. Review diabetic management.` });
    else if (vitals.glucose_level < 70 && vitals.glucose_level > 0) notes.push({ type: 'warning', text: `Hypoglycemia: ${vitals.glucose_level} mg/dL. Immediate glucose supplementation recommended.` });

    return notes;
  };

  const dummyChartData = [
    { time: '08:00', hr: 72, bp: 120 },
    { time: '10:00', hr: 75, bp: 118 },
    { time: '12:00', hr: 82, bp: 122 },
    { time: '14:00', hr: 78, bp: 121 },
    { time: '16:00', hr: 85, bp: 125 },
    { time: '18:00', hr: 80, bp: 119 },
    { time: '20:00', hr: 74, bp: 117 },
  ];

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Activity size={48} color="var(--primary)" />
      </motion.div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)' }}>
            <Activity color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.8px', background: 'linear-gradient(to right, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HealthGuard</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SidebarItem icon={Activity} label="Overview" active={activeTab === 'Overview'} onClick={() => { setActiveTab('Overview'); setSelectedPatient(null); }} />
          <SidebarItem icon={Users} label="Patients" active={activeTab === 'Patients'} onClick={() => { setActiveTab('Patients'); setSelectedPatient(null); }} />
          <SidebarItem icon={Calendar} label="Appointments" active={activeTab === 'Appointments'} onClick={() => { setActiveTab('Appointments'); setSelectedPatient(null); }} />
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                {dashboardData.doctor.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dashboardData.doctor.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dashboardData.doctor.specialization}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>
              {selectedPatient ? `Patient Detail: ${selectedPatient.first_name} ${selectedPatient.last_name}` : `HealthGuard Clinical System`}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{selectedPatient ? `Monitoring results for ${selectedPatient.first_name}` : `Redesigned Dashboard Dashboard`}</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
             <div className="glass-card" style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input placeholder="Search records..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.875rem' }} />
             </div>
             <div style={{ position: 'relative' }}>
                <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    className="glass-card" 
                    style={{ padding: '10px', position: 'relative', cursor: 'pointer' }}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--bg-card)' }} />
                    )}
                </motion.div>
                
                <AnimatePresence>
                    {isNotificationsOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            style={{ position: 'absolute', top: '50px', right: 0, width: '300px', zIndex: 100 }}
                            className="glass-card"
                        >
                            <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600 }}>Notifications</span>
                                <button onClick={() => setNotifications([])} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Clear All</button>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No new alerts</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, color: n.type === 'urgent' ? 'var(--danger)' : 'white' }}>{n.title}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                                            </div>
                                            <p style={{ margin: 0 }}>{n.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
          </div>
        </header>

        {activeTab === 'Overview' && !selectedPatient && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Overview Cards */}
            <div className="vitals-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <StatCard label="Active Patients" value={dashboardData.metrics.active_patients} unit="" icon={Users} trend={2.5} color="#6366f1" />
              <StatCard label="High Risk Patients" value={dashboardData.metrics.high_risk} unit="" icon={Zap} trend={-1.2} color="#f59e0b" />
              <StatCard label="Open Alerts" value={dashboardData.metrics.open_alerts} unit="" icon={Bell} trend={0} color="#f43f5e" />
              <StatCard label="Today's Revenue" value={`$${dashboardData.metrics.today_revenue}`} unit="" icon={Activity} trend={8.4} color="#10b981" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              {/* Critical Alerts Section */}
              <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 10px var(--danger)' }} />
                    Critical Alerts (Risk &gt; 100)
                  </h3>
                  <span className="badge badge-high">{dashboardData.alerts.critical.length} Urgent</span>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {dashboardData.alerts.critical.map((alert) => (
                      <div key={alert.prediction_id} className="glass-card" style={{ background: 'rgba(244, 63, 94, 0.03)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{alert.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>ID: {alert.patient_id} | Ward: {alert.ward || 'N/A'}</span></div>
                            <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem' }}>Risk Score: {alert.risk_score}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Next Appointment</div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {alert.next_appointment ? new Date(alert.next_appointment).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'}</div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
                           <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SpO2</div>
                              <div style={{ fontWeight: 700, color: alert.spo2 < 95 ? 'var(--danger)' : 'white' }}>{alert.spo2}%</div>
                           </div>
                           <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Heart Rate</div>
                              <div style={{ fontWeight: 700, color: alert.heart_rate > 100 ? 'var(--danger)' : 'white' }}>{alert.heart_rate} bpm</div>
                           </div>
                           <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BP</div>
                              <div style={{ fontWeight: 700 }}>{alert.bp_sys}/{alert.bp_dia}</div>
                           </div>
                        </div>

                        {alert.symptoms && (
                           <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                              <strong>Symptoms:</strong> {alert.symptoms}
                           </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => {
                               const names = (alert.name || '').split(' ');
                               selectPatient({ patient_id: alert.patient_id, first_name: names[0] || 'Patient', last_name: names[1] || '' });
                            }}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                          >
                            View Details
                          </button>
                          <button 
                            onClick={async () => {
                              await acknowledgeAlert(alert.prediction_id);
                              fetchData();
                            }}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Acknowledge Alert
                          </button>
                        </div>
                      </div>
                    ))}
                    {dashboardData.alerts.critical.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <Zap size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                        <p>No critical alerts at this time.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* High Priority Alerts */}
              <div className="glass-card" style={{ padding: '0' }}>
                 <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 10px var(--warning)' }} />
                      High Priority (70-100)
                    </h3>
                 </div>
                 <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {dashboardData.alerts.high_priority.map((alert) => (
                        <div key={alert.prediction_id} style={{ padding: '15px', borderLeft: '4px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '4px 12px 12px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{alert.name}</div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600 }}>Score: {alert.risk_score}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ChevronDown size={14} /> {alert.trend_message}
                              </span>
                            </div>
                          </div>
                          <button 
                             onClick={() => {
                               const names = (alert.name || '').split(' ');
                               selectPatient({ patient_id: alert.patient_id, first_name: names[0] || 'Patient', last_name: names[1] || '' });
                             }}
                             style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                          >
                             Review
                          </button>
                        </div>
                      ))}
                      {dashboardData.alerts.high_priority.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          All stable in high priority.
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>

            {/* Today's Schedule Section */}
            <div className="glass-card" style={{ padding: '0' }}>
               <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today's Schedule</h3>
                  <button onClick={() => setActiveTab('Appointments')} style={{ fontSize: '0.85rem', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View Calendar</button>
               </div>
               <div style={{ padding: '20px' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '15px' }}>Time</th>
                          <th style={{ padding: '15px' }}>Patient (ID)</th>
                          <th style={{ padding: '15px' }}>Appointment Type</th>
                          <th style={{ padding: '15px' }}>Status</th>
                          <th style={{ padding: '15px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.today_schedule.map((appt, idx) => {
                          const isNext = idx === 0 && appt.status === 'SCHEDULED';
                          const reasonLower = (appt.reason || '').toLowerCase();
                          const isUrgent = reasonLower.includes('urgent') || reasonLower.includes('emergency');
                          
                          return (
                            <tr key={appt.appointment_id} style={{ 
                               borderBottom: idx !== dashboardData.today_schedule.length - 1 ? '1px solid var(--border)' : 'none',
                               background: isNext ? 'rgba(99, 102, 241, 0.05)' : isUrgent ? 'rgba(244, 63, 94, 0.05)' : 'transparent'
                            }}>
                              <td style={{ padding: '15px', fontWeight: 600 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   <Clock size={16} color={isNext ? 'var(--primary)' : 'var(--text-muted)'} />
                                   {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td style={{ padding: '15px' }}>
                                <div style={{ fontWeight: 600 }}>{appt.patient_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{appt.patient_id}</div>
                              </td>
                              <td style={{ padding: '15px' }}>
                                <span style={{ fontSize: '0.9rem' }}>{appt.reason || 'General Consultation'}</span>
                              </td>
                              <td style={{ padding: '15px' }}>
                                <span className={`badge ${appt.status === 'COMPLETED' ? 'badge-low' : appt.status === 'CANCELLED' ? 'badge-high' : 'badge-med'}`} style={{ 
                                   fontSize: '0.75rem',
                                   background: isNext ? 'var(--primary)' : isUrgent ? 'var(--danger)' : ''
                                }}>
                                  {isNext ? 'NEXT' : appt.status}
                                </span>
                              </td>
                              <td style={{ padding: '15px' }}>
                                <button 
                                  onClick={() => {
                                     const names = (appt.patient_name || '').split(' ');
                                     selectPatient({ patient_id: appt.patient_id, first_name: names[0] || 'Patient', last_name: names[1] || '' });
                                  }}
                                  style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                  View Patient
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {dashboardData.today_schedule.length === 0 && (
                          <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No appointments scheduled for today.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Patients' && !selectedPatient && <PatientsView patients={patients} onSelect={selectPatient} onRefresh={fetchData} onAddClick={() => setIsAddPatientOpen(true)} />}
        {activeTab === 'Appointments' && <AppointmentsView doctorId={doctorId} appointments={appointments} />}

        {/* Patient Detail View */}
        <AnimatePresence>
          {selectedPatient && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {patientDetailLoading ? (
                 <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading patient details...</div>
               ) : (
               <>
               {/* Header Card */}
               <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                     <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 700 }}>{selectedPatient.first_name?.[0] || ''}{selectedPatient.last_name?.[0] || ''}</div>
                        <div>
                           <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                           <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                              <span style={{ color: 'var(--text-muted)' }}>ID: #{selectedPatient.patient_id}</span>
                              {patientDetail?.patient?.gender && <span style={{ color: 'var(--text-muted)' }}>{patientDetail.patient.gender}</span>}
                              {patientDetail?.patient?.dob && <span style={{ color: 'var(--text-muted)' }}>DOB: {new Date(patientDetail.patient.dob).toLocaleDateString()}</span>}
                              {patientDetail?.patient?.ward && <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Ward {patientDetail.patient.ward}</span>}
                           </div>
                           <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', marginTop: '6px', flexWrap: 'wrap' }}>
                              {patientDetail?.patient?.phone && <span style={{ color: 'var(--secondary)' }}>📞 {patientDetail.patient.phone}</span>}
                              {patientDetail?.patient?.address && <span style={{ color: 'var(--text-muted)' }}>📍 {patientDetail.patient.address}</span>}
                              <span style={{ color: 'var(--text-muted)' }}>Registered: {new Date(selectedPatient.created_at || patientDetail?.patient?.created_at).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                     <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button 
                           onClick={() => {
                              const v = patientDetail?.latest_vitals || selectedPatient;
                              const p = patientDetail?.predictions?.[0];
                              const content = `CLINICAL REPORT\n${'='.repeat(40)}\nPatient: ${selectedPatient.first_name} ${selectedPatient.last_name}\nID: #${selectedPatient.patient_id}\nDate: ${new Date().toLocaleString()}\n${patientDetail?.patient?.gender ? `Gender: ${patientDetail.patient.gender}` : ''}\n${patientDetail?.patient?.dob ? `DOB: ${new Date(patientDetail.patient.dob).toLocaleDateString()}` : ''}\n\nVITALS:\n  Heart Rate: ${v?.heart_rate || 'N/A'} bpm\n  Blood Pressure: ${v?.blood_pressure_systolic || 'N/A'}/${v?.blood_pressure_diastolic || 'N/A'} mmHg\n  Oxygen: ${v?.oxygen_saturation || 'N/A'}%\n  Temperature: ${v?.temperature || 'N/A'}°C\n  Glucose: ${v?.glucose_level || 'N/A'} mg/dL\n\nRISK ASSESSMENT:\n  Score: ${p?.score || 'N/A'}/100\n  Risk Level: ${p?.risk_level || 'N/A'}\n\n${'='.repeat(40)}\nGenerated by HealthGuard Clinical System`;
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `report_${selectedPatient.last_name}_${new Date().toISOString().slice(0,10)}.txt`;
                              a.click();
                           }}
                           className="glass-card" 
                           style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                           <FileText size={16} /> Report
                        </button>
                        <button onClick={() => setIsAddVitalsOpen(true)} className="glass-card" style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
                           <Zap size={16} /> Add Vitals
                        </button>
                        <button onClick={() => setIsDischargeOpen(true)} className="glass-card" style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
                           <LogOut size={16} /> Discharge
                        </button>
                        <button onClick={clearSelectedPatient} className="glass-card" style={{ padding: '8px 16px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}>← Back</button>
                     </div>
                  </div>
               </div>

               {/* Vital Stats Grid - 6 cards */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {(() => {
                    const v = patientDetail?.latest_vitals || selectedPatient;
                    const getVitalColor = (val, low, high) => val < low || val > high ? '#f43f5e' : '#22c55e';
                    return <>
                      <StatCard label="Heart Rate" value={v?.heart_rate || '--'} unit="bpm" icon={Heart} color={getVitalColor(v?.heart_rate || 75, 60, 100)} />
                      <StatCard label="SpO₂" value={v?.oxygen_saturation || '--'} unit="%" icon={Zap} color={getVitalColor(v?.oxygen_saturation || 98, 95, 101)} />
                      <StatCard label="BP Systolic" value={v?.blood_pressure_systolic || '--'} unit="mmHg" icon={Activity} color={getVitalColor(v?.blood_pressure_systolic || 120, 90, 140)} />
                      <StatCard label="BP Diastolic" value={v?.blood_pressure_diastolic || '--'} unit="mmHg" icon={Activity} color={getVitalColor(v?.blood_pressure_diastolic || 80, 60, 90)} />
                      <StatCard label="Temperature" value={v?.temperature || '--'} unit="°C" icon={Thermometer} color={getVitalColor(v?.temperature || 37, 36, 38)} />
                      <StatCard label="Glucose" value={v?.glucose_level || '--'} unit="mg/dL" icon={Heart} color={getVitalColor(v?.glucose_level || 100, 70, 180)} />
                    </>;
                  })()}
               </div>

               {/* Two columns: Vitals Chart + Clinical Assessment */}
               <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                  {/* Vitals Trend Chart */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                     <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Vitals Trend</h3>
                     {patientDetail?.vitals_history?.length > 0 ? (
                       <div style={{ height: '250px' }}>
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={[...patientDetail.vitals_history].reverse().map(v => ({
                             time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                             hr: v.heart_rate,
                             sys: v.blood_pressure_systolic,
                             spo2: v.oxygen_saturation
                           }))}>
                             <defs>
                               <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                                 <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                             <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                             <YAxis stroke="var(--text-muted)" fontSize={11} />
                             <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                             <Area type="monotone" dataKey="hr" stroke="#f43f5e" fill="url(#hrGrad)" name="Heart Rate" />
                             <Area type="monotone" dataKey="sys" stroke="#8b5cf6" fillOpacity={0} name="Systolic" />
                             <Area type="monotone" dataKey="spo2" stroke="#06b6d4" fillOpacity={0} name="SpO₂" />
                           </AreaChart>
                         </ResponsiveContainer>
                       </div>
                     ) : (
                       <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No vitals history available</div>
                     )}
                  </div>

                  {/* Clinical Assessment */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                     <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Clinical Assessment</h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {(() => {
                         const notes = generateClinicalAssessment(patientDetail?.latest_vitals || selectedPatient);
                         if (notes.length === 0) return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No vitals available for assessment.</div>;
                         return notes.map((note, i) => (
                           <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', lineHeight: 1.5,
                             background: note.type === 'critical' ? 'rgba(239,68,68,0.12)' : note.type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.08)',
                             borderLeft: `3px solid ${note.type === 'critical' ? '#ef4444' : note.type === 'warning' ? '#f59e0b' : '#22c55e'}`
                           }}>
                             <span style={{ fontWeight: 600, marginRight: '6px', color: note.type === 'critical' ? '#ef4444' : note.type === 'warning' ? '#f59e0b' : '#22c55e' }}>
                               {note.type === 'critical' ? '🔴' : note.type === 'warning' ? '🟡' : '🟢'}
                             </span>
                             {note.text}
                           </div>
                         ));
                       })()}

                       {/* Health Score from predictions */}
                       {patientDetail?.predictions?.length > 0 && (
                         <div style={{ marginTop: '10px', padding: '12px', borderRadius: '8px', background: 'var(--bg-main)' }}>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Risk Score History</div>
                           <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                             {patientDetail.predictions.slice(0, 5).map((p, i) => (
                               <span key={i} style={{
                                 padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                 background: p.risk_level === 'HIGH' ? 'rgba(239,68,68,0.15)' : p.risk_level === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                                 color: p.risk_level === 'HIGH' ? '#ef4444' : p.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e'
                               }}>
                                 {Math.round(p.score)}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                  </div>
               </div>

               {/* Appointment History */}
               {patientDetail?.appointments?.length > 0 && (
                 <div className="glass-card" style={{ padding: '0' }}>
                   <div style={{ padding: '1.5rem 1.5rem 0' }}>
                     <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Appointment History ({patientDetail.appointments.length})</h3>
                   </div>
                   <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                     <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                       <thead>
                         <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                           <th style={{ padding: '12px 20px' }}>Date</th>
                           <th style={{ padding: '12px 20px' }}>Doctor</th>
                           <th style={{ padding: '12px 20px' }}>Reason</th>
                           <th style={{ padding: '12px 20px' }}>Status</th>
                         </tr>
                       </thead>
                       <tbody>
                         {patientDetail.appointments.map((a, i) => (
                           <tr key={i} style={{ borderBottom: i < patientDetail.appointments.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '0.85rem' }}>
                             <td style={{ padding: '12px 20px' }}>{new Date(a.scheduled_at).toLocaleDateString()}</td>
                             <td style={{ padding: '12px 20px', fontWeight: 500 }}>Dr. {a.doctor_name || 'N/A'}</td>
                             <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{a.reason || 'Consultation'}</td>
                             <td style={{ padding: '12px 20px' }}>
                               <span className={`badge ${a.status === 'COMPLETED' ? 'badge-low' : a.status === 'CANCELLED' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: '0.7rem' }}>{a.status}</span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               )}

               {/* Billing Summary */}
               {patientDetail?.billing?.length > 0 && (
                 <div className="glass-card" style={{ padding: '1.5rem' }}>
                   <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Billing Summary</h3>
                   <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                     {patientDetail.billing.map((b, i) => (
                       <div key={i} style={{ background: 'var(--bg-main)', padding: '12px 16px', borderRadius: '10px', minWidth: '140px' }}>
                         <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>${b.total_amount}</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(b.billed_at).toLocaleDateString()}</div>
                         <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block',
                           background: b.status === 'PAID' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                           color: b.status === 'PAID' ? '#22c55e' : '#f59e0b'
                         }}>{b.status}</span>
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
      </main>
      <AddPatientModal 
        isOpen={isAddPatientOpen} 
        onClose={() => setIsAddPatientOpen(false)} 
        onSuccess={fetchData} 
      />
      <AddVitalsModal 
        isOpen={isAddVitalsOpen} 
        onClose={() => setIsAddVitalsOpen(false)} 
        patientId={selectedPatient?.patient_id}
        onSuccess={() => {
          fetchData();
        }} 
      />
      <DischargeModal 
        isOpen={isDischargeOpen}
        onClose={() => setIsDischargeOpen(false)}
        onSuccess={() => {
          setSelectedPatient(null);
          fetchData();
        }}
        patientId={selectedPatient?.patient_id}
        doctorId={doctorId}
      />
    </div>
  );
};

export default DoctorDashboard;
