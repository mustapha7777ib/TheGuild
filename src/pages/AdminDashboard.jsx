import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalArtisans: 0, averageRating: 0, totalJobPostings: 0 });
  const [activities, setActivities] = useState({ coinPurchases: [], deals: [], messages: [], recentSignups: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [signupTrends, setSignupTrends] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoints = ["users", "artisans", "stats", "coin-purchases", "deals", "messages", "recent-signups", "audit-logs"];
      const responses = await Promise.all(
        endpoints.map(ep => fetch(`http://localhost:8080/api/admin/${ep}`, { credentials: "include" }))
      );

      const [u, a, s, cp, d, m, rs, al] = await Promise.all(responses.map(r => r.json()));

      setMetrics({
        totalUsers: u.total,
        totalArtisans: a.total,
        averageRating: s.averageRating || 0,
        totalJobPostings: s.totalJobPostings || 0
      });
      setActivities({
        coinPurchases: cp.slice(0, 10),
        deals: d.slice(0, 10),
        messages: m.slice(0, 10),
        recentSignups: rs
      });
      setAuditLogs(al);
      
      const trendsRes = await fetch(`http://localhost:8080/api/admin/signup-trends?range=${timeRange}&role=${roleFilter}`, { credentials: "include" });
      if (trendsRes.ok) setSignupTrends(await trendsRes.json());

      setLastUpdated(new Date());
    } catch (err) {
      setError("System failed to synchronize latest data.");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, roleFilter]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) navigate("/signin");
    if (user?.role === "admin") fetchAdminData();
  }, [user, authLoading, fetchAdminData, navigate]);

  const chartData = {
    labels: signupTrends.map((t) => t.date),
    datasets: [{
      fill: true,
      label: "New Enrollments",
      data: signupTrends.map((t) => t.count),
      borderColor: "#d97706", // Amber 600
      backgroundColor: "rgba(217, 119, 6, 0.05)",
      tension: 0.4,
      pointRadius: 2,
    }],
  };

  const filteredSignups = activities.recentSignups.filter(s => 
    (roleFilter === "all" || s.role === roleFilter) &&
    (`${s.first_name} ${s.last_name} ${s.email}`).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSignups = filteredSignups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (authLoading || isLoading) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Editorial Sidebar */}
      <aside className="w-72 bg-stone-900 hidden lg:flex flex-col p-10 text-white">
        <div className="mb-16">
          <h1 className="text-2xl font-serif tracking-tight">THE GUILD</h1>
          <p className="text-[9px] uppercase tracking-[0.4em] text-amber-500 font-bold">Administration</p>
        </div>
        
        <nav className="space-y-8 flex-grow">
          <div className="space-y-4">
             <p className="text-[9px] uppercase tracking-widest text-stone-500 font-black">Registry</p>
             <button className="block text-amber-500 font-serif text-lg italic">System Overview</button>
             <button className="block text-stone-400 hover:text-white transition-colors font-serif text-lg">Master Directory</button>
             <button className="block text-stone-400 hover:text-white transition-colors font-serif text-lg">Work Commissions</button>
          </div>
          
          <div className="space-y-4">
             <p className="text-[9px] uppercase tracking-widest text-stone-500 font-black">Financials</p>
             <button className="block text-stone-400 hover:text-white transition-colors font-serif text-lg">Credit Logs</button>
             <button className="block text-stone-400 hover:text-white transition-colors font-serif text-lg">Ledger Export</button>
          </div>
        </nav>

        <div className="pt-10 border-t border-stone-800">
           <p className="text-[9px] text-stone-500 uppercase tracking-widest">Operator</p>
           <p className="text-sm font-serif italic text-stone-300">{user?.first_name} {user?.last_name}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-16 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-5xl font-serif text-stone-900 tracking-tighter">Oversight Ledger</h2>
            <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">
              Synchronized: {lastUpdated?.toLocaleTimeString()}
            </p>
          </div>
          <button 
            onClick={fetchAdminData} 
            className="px-8 py-3 bg-stone-900 text-white text-[10px] uppercase font-bold tracking-[0.2em] shadow-xl hover:bg-amber-600 transition-all"
          >
            Force Synchronization
          </button>
        </header>

        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: "Population", val: metrics.totalUsers, accent: "bg-stone-100" },
            { label: "Masters", val: metrics.totalArtisans, accent: "bg-amber-50" },
            { label: "Merit Avg", val: `${metrics.averageRating.toFixed(1)}/5`, accent: "bg-stone-100" },
            { label: "Commissions", val: metrics.totalJobPostings, accent: "bg-stone-100" },
          ].map((m, i) => (
            <div key={i} className={`${m.accent} p-8 border border-stone-200/50 relative overflow-hidden group`}>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-4">{m.label}</p>
              <p className="text-4xl font-serif text-stone-900">{m.val}</p>
              <div className="absolute bottom-0 right-0 w-12 h-1 bg-stone-900 group-hover:w-full transition-all duration-500" />
            </div>
          ))}
        </div>

        {/* Chart & Audit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2 bg-white border border-stone-100 p-10 shadow-sm">
            <div className="flex justify-between items-baseline mb-10 border-b border-stone-50 pb-4">
              <h3 className="font-serif text-2xl text-stone-900">Acquisition Trends</h3>
              <select 
                className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-amber-600 outline-none" 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="h-72">
              <Line data={chartData} options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                  y: { grid: { color: "#f5f5f4" }, ticks: { font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                } 
              }} />
            </div>
          </div>

          {/* Audit Logs as a Timeline */}
          <div className="bg-stone-900 text-white p-10">
            <h3 className="font-serif text-2xl mb-8 border-b border-stone-800 pb-4">Security Logs</h3>
            <div className="space-y-6 max-h-80 overflow-y-auto pr-4">
              {auditLogs.slice(0, 6).map((log, i) => (
                <div key={i} className="border-l border-amber-600/30 pl-4 py-1">
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">{log.action}</p>
                  <p className="text-xs text-stone-400 font-serif italic mt-1">{log.admin}</p>
                  <p className="text-[8px] text-stone-600 uppercase mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member Registry Table */}
        <section className="bg-white border border-stone-100 shadow-xl shadow-stone-200/20">
          <div className="p-10 border-b border-stone-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="font-serif text-3xl text-stone-900">Member Registry</h3>
            <div className="flex gap-4 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Find Identity..." 
                className="text-[10px] uppercase tracking-widest border-b border-stone-200 py-2 w-full md:w-64 outline-none focus:border-amber-600 transition-colors"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="text-[10px] uppercase font-bold tracking-widest border-none bg-stone-50 px-4"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Ranks</option>
                <option value="artisan">Masters</option>
                <option value="user">Clients</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50 text-stone-400 uppercase text-[9px] font-black tracking-[0.2em]">
                  <th className="px-10 py-6">Identity</th>
                  <th className="px-10 py-6">Designation</th>
                  <th className="px-10 py-6">Enrollment Date</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {paginatedSignups.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <p className="font-serif text-lg text-stone-900">{s.first_name} {s.last_name}</p>
                      <p className="text-[10px] text-stone-400 tracking-wide font-medium">{s.email}</p>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`text-[9px] font-black px-3 py-1 uppercase tracking-tighter ${s.role === 'artisan' ? 'text-amber-600 border border-amber-200' : 'text-stone-500 border border-stone-200'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-[10px] text-stone-500 uppercase font-bold">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-10 py-6 text-right space-x-6">
                      <button onClick={() => { setSelectedUser(s); setShowEditModal(true); }} className="text-[9px] uppercase font-black tracking-widest text-stone-400 hover:text-amber-600 transition-colors">Amend</button>
                      <button className="text-[9px] uppercase font-black tracking-widest text-stone-400 hover:text-red-600 transition-colors">Sanction</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Editorial Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-600" />
            <h3 className="text-3xl font-serif mb-2">Amend Identity</h3>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-10">Official Member Records</p>
            
            <div className="space-y-8">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">Full Name</label>
                <input className="w-full py-3 border-b border-stone-200 font-serif text-lg outline-none focus:border-amber-600" value={selectedUser.first_name} onChange={(e) => setSelectedUser({...selectedUser, first_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">Email Address</label>
                <input className="w-full py-3 border-b border-stone-200 font-serif text-lg outline-none focus:border-amber-600" value={selectedUser.email} onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">Rank Assignment</label>
                <select className="w-full py-3 border-b border-stone-200 font-serif text-lg outline-none bg-transparent" value={selectedUser.role} onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}>
                  <option value="user">Client</option>
                  <option value="artisan">Master Artisan</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-12">
              <button className="flex-1 bg-stone-900 text-white py-5 text-[10px] uppercase font-bold tracking-widest hover:bg-amber-600 transition-all shadow-xl">Seal Changes</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 border border-stone-200 text-stone-400 py-5 text-[10px] uppercase font-bold tracking-widest hover:bg-stone-50">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;