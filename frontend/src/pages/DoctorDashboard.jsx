import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  DollarSign, 
  Heart, 
  Thermometer, 
  Droplet, 
  Zap, 
  Bell, 
  Search,
  ChevronUp,
  ChevronDown,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  FileText,
  UserPlus,
  Filter
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
  Area,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getVitals, getHighRiskPatients, getDoctorSchedule, getMonthlyRevenue, bookAppointment, addPatient, getAllPatients, addVitals } from '../api';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
              {p.first_name[0]}{p.last_name[0]}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {p.patient_id}</div>
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
            {p.recorded_at ? `Last activity: ${new Date(p.recorded_at).toLocaleTimeString()}` : 'No vitals recorded yet'}
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

const AppointmentsView = ({ doctorId = 1 }) => {
  const [schedule, setSchedule] = useState([]);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    getDoctorSchedule(doctorId).then(setSchedule);
  }, [doctorId]);

  const handleBook = async (slot) => {
    try {
      await bookAppointment({
        patient_id: 1, // hardcoded for demo
        doctor_id: doctorId,
        date: slot.available_date,
        slot_start: slot.slot_start
      });
      alert('Appointment booked successfully!');
      getDoctorSchedule(doctorId).then(setSchedule);
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Availability & Scheduling</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
           <div className="glass-card" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <Filter size={16} color="var(--text-muted)" />
              <span>Dr. Harrison</span>
           </div>
        </div>
      </div>
      <div className="glass-card" style={{ padding: '0' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '20px' }}>Date</th>
                <th style={{ padding: '20px' }}>Slot Time</th>
                <th style={{ padding: '20px' }}>Capacity</th>
                <th style={{ padding: '20px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s, i) => (
                <tr key={i} style={{ borderBottom: i !== schedule.length -1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '20px' }}>{s.available_date}</td>
                  <td style={{ padding: '20px', fontWeight: 500 }}>{s.slot_start} - {s.slot_end}</td>
                  <td style={{ padding: '20px' }}>
                     <div style={{ width: '100px', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(s.booked_patients / s.max_patients) * 100}%`, height: '100%', background: 'var(--primary)' }} />
                     </div>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{s.booked_patients} / {s.max_patients} Filled</span>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <button 
                      onClick={() => handleBook(s)}
                      disabled={s.booked_patients >= s.max_patients}
                      className="glass-card" 
                      style={{ padding: '8px 16px', background: s.booked_patients >= s.max_patients ? 'transparent' : 'var(--primary)', border: 'none', color: 'white', opacity: s.booked_patients >= s.max_patients ? 0.3 : 1, cursor: 'pointer' }}
                    >
                      {s.booked_patients >= s.max_patients ? 'Fully Booked' : 'Book Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

const BillingView = () => {
  const [revenue, setRevenue] = useState([]);

  useEffect(() => {
    getMonthlyRevenue().then(setRevenue);
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Financial Reporting</h2>
       <div className="vitals-grid">
          <StatCard label="Total Revenue" value={revenue.reduce((a, b) => a + parseFloat(b.total_revenue), 0).toFixed(2)} unit="$" icon={DollarSign} color="var(--success)" />
          <StatCard label="Monthly Avg" value={(revenue.reduce((a, b) => a + parseFloat(b.total_revenue), 0) / (revenue.length || 1)).toFixed(2)} unit="$" icon={TrendingUp} color="var(--primary)" />
          <StatCard label="Billed Items" value={revenue.reduce((a, b) => a + parseInt(b.bills_count), 0)} unit="Units" icon={FileText} color="#f59e0b" />
       </div>

       <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '2rem' }}>Revenue Trends (6 Months)</h3>
          <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue}>
                   <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short' })} />
                   <YAxis stroke="var(--text-muted)" fontSize={12} />
                   <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                   <Bar dataKey="total_revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div className="glass-card" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <thead>
               <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                 <th style={{ padding: '20px' }}>Month</th>
                 <th style={{ padding: '20px' }}>Base</th>
                 <th style={{ padding: '20px' }}>Tax</th>
                 <th style={{ padding: '20px' }}>Discounts</th>
                 <th style={{ padding: '20px' }}>Total Revenue</th>
               </tr>
             </thead>
             <tbody>
                {revenue.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: '20px', fontWeight: 600 }}>{new Date(r.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</td>
                    <td style={{ padding: '20px' }}>${r.total_base_amount}</td>
                    <td style={{ padding: '20px' }}>${r.total_tax_amount}</td>
                    <td style={{ padding: '20px', color: 'var(--danger)' }}>-${r.total_discount_amount}</td>
                    <td style={{ padding: '20px', fontWeight: 700, color: 'var(--success)' }}>${r.total_revenue}</td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [vitals, setVitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [highRisk, setHighRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false);

  const fetchData = async () => {
    console.log("App: Starting data fetch...");
    try {
      const results = await Promise.allSettled([
        getVitals(),
        getHighRiskPatients(),
        getAllPatients()
      ]);

      if (results[0].status === 'fulfilled') setVitals(results[0].value);
      if (results[1].status === 'fulfilled') setHighRisk(results[1].value);
      if (results[2].status === 'fulfilled') setPatients(results[2].value);

      console.log("App: Data fetch complete.", {
        vitals: results[0].status,
        highRisk: results[1].status,
        patients: results[2].status
      });
    } catch (err) {
      console.error("Fetch failed unexpectedly:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync selected patient data if the patients list is refreshed
  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find(p => p.patient_id === selectedPatient.patient_id);
      if (updated) setSelectedPatient(updated);
    }
  }, [patients]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px' }}>
            <Activity color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>VibeMonitoring</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SidebarItem icon={Activity} label="Overview" active={activeTab === 'Overview'} onClick={() => { setActiveTab('Overview'); setSelectedPatient(null); }} />
          <SidebarItem icon={Users} label="Patients" active={activeTab === 'Patients'} onClick={() => { setActiveTab('Patients'); setSelectedPatient(null); }} />
          <SidebarItem icon={Calendar} label="Appointments" active={activeTab === 'Appointments'} onClick={() => { setActiveTab('Appointments'); setSelectedPatient(null); }} />
          <SidebarItem icon={DollarSign} label="Billing" active={activeTab === 'Billing'} onClick={() => { setActiveTab('Billing'); setSelectedPatient(null); }} />
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div className="glass-card" style={{ padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #6366f1, #a855f7)' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Dr. Harrison</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead Cardiologist</div>
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
              {selectedPatient ? `Patient Detail: ${selectedPatient.first_name} ${selectedPatient.last_name}` : `Clinical ${activeTab}`}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Real-time patient monitoring & decision support</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
             <div className="glass-card" style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input placeholder="Search records..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.875rem' }} />
             </div>
             <motion.div whileHover={{ scale: 1.1 }} className="glass-card" style={{ padding: '10px', position: 'relative' }}>
                <Bell size={20} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--bg-card)' }} />
             </motion.div>
          </div>
        </header>

        {activeTab === 'Overview' && !selectedPatient && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="vitals-grid">
              <StatCard label="Heart Rate" value="78" unit="bpm" icon={Heart} trend={4.2} color="#f43f5e" />
              <StatCard label="Oxygen Level" value="98" unit="%" icon={Zap} trend={0.5} color="#06b6d4" />
              <StatCard label="Systolic BP" value="120" unit="mmHg" icon={Activity} trend={-1.2} color="#8b5cf6" />
              <StatCard label="Temperature" value="36.8" unit="°C" icon={Thermometer} trend={0.2} color="#f59e0b" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '2rem' }}>Active Vitals Monitoring</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dummyChartData}>
                      <defs>
                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px' }} />
                      <Area type="monotone" dataKey="hr" stroke="#f43f5e" fillOpacity={1} fill="url(#colorHr)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card">
                <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>High-Risk Alerts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {highRisk.map((p, i) => (
                    <div key={i} style={{ padding: '12px', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px 8px 8px 4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.first_name} {p.last_name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score: {p.last_score}</span>
                        <span className="badge badge-high" style={{ fontSize: '0.6rem' }}>Critical</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Patients' && !selectedPatient && <PatientsView patients={patients} onSelect={setSelectedPatient} onRefresh={fetchData} onAddClick={() => setIsAddPatientOpen(true)} />}
        {activeTab === 'Appointments' && <AppointmentsView />}
        {activeTab === 'Billing' && <BillingView />}

        {/* Patient Detail View */}
        <AnimatePresence>
          {selectedPatient && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--primary)' }}>{selectedPatient.first_name[0]}</div>
                        <div>
                           <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                           <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                               <p style={{ color: 'var(--text-muted)' }}>Registered: {new Date(selectedPatient.created_at).toLocaleDateString()}</p>
                               <p style={{ color: 'var(--secondary)' }}>Latest Reading: {selectedPatient.recorded_at ? new Date(selectedPatient.recorded_at).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                     </div>
                     <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                           onClick={() => setIsAddVitalsOpen(true)}
                           className="glass-card" 
                           style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '8px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}
                        >
                           <Zap size={18} /> Add New Reading
                        </button>
                        <button onClick={() => setSelectedPatient(null)} className="glass-card" style={{ padding: '8px 16px', background: 'transparent' }}>Back to List</button>
                     </div>
                  </div>
               </div>

               <div className="vitals-grid">
                  <StatCard label="Heart Rate" value={selectedPatient.heart_rate || '--'} unit="bpm" icon={Heart} color="#f43f5e" />
                  <StatCard label="Oxygen" value={selectedPatient.oxygen_saturation || '--'} unit="%" icon={Zap} color="#06b6d4" />
                  <StatCard label="Systolic" value={selectedPatient.blood_pressure_systolic || '--'} unit="mmHg" icon={Activity} color="#8b5cf6" />
                  <StatCard label="Temp" value={selectedPatient.temperature || '--'} unit="°C" icon={Thermometer} color="#f59e0b" />
               </div>

               <div className="glass-card" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '2rem' }}>Clinical Notes & History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                     <div className="glass-card" style={{ border: 'none', background: 'var(--bg-main)', padding: '15px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Latest Assessment</div>
                        <p>Patient vitals are within stable ranges. Blood pressure monitors as slightly elevated. Recommend continued sodium reduction and daily light exercise.</p>
                     </div>
                     {/* Add more history entries here */}
                  </div>
               </div>
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
          // Also update the selected patient state if we are in detail view
          if (selectedPatient) {
             // In a real app we'd fetch the single patient again, 
             // for now we'll just refresh the global list and keep 
             // the UI state as is, or we could find the patient in the new list
          }
        }} 
      />
    </div>
  );
};

export default App;
