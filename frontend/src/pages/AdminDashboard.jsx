import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Settings, BarChart2, Bell, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [notices, setNotices] = useState([]);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Notice Form State
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // Status Update State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePriority, setUpdatePriority] = useState('');
  const [updateNote, setUpdateNote] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [complaintsRes, metricsRes, noticesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/complaints`, { headers }),
        axios.get(`${API_BASE_URL}/api/dashboard`, { headers }),
        axios.get(`${API_BASE_URL}/api/notices`, { headers })
      ]);
      
      setComplaints(complaintsRes.data);
      setMetrics(metricsRes.data);
      setNotices(noticesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/complaints/${selectedComplaint.id}`, {
        status: updateStatus,
        priority: updatePriority,
        note: updateNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedComplaint(null);
      setUpdateNote('');
      fetchData();
    } catch (error) {
      console.error("Error updating complaint:", error);
      alert("Failed to update complaint.");
    }
  };

  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    setSubmittingNotice(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/notices`, {
        title: noticeTitle,
        content: noticeContent,
        isImportant
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowNoticeForm(false);
      setNoticeTitle('');
      setNoticeContent('');
      setIsImportant(false);
      fetchData();
    } catch (error) {
      console.error("Error posting notice:", error);
      alert("Failed to post notice.");
    } finally {
      setSubmittingNotice(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'LOW': return <span className="badge badge-low">Low</span>;
      case 'MEDIUM': return <span className="badge badge-medium">Medium</span>;
      case 'HIGH': return <span className="badge badge-high">High</span>;
      default: return null;
    }
  };

  // Filter and Sort Complaints
  const filteredAndSortedComplaints = useMemo(() => {
    // 1. Filter
    let result = complaints.filter(c => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterDate) {
        const cDate = new Date(c.createdAt).toISOString().split('T')[0];
        if (cDate !== filterDate) return false;
      }
      return true;
    });

    // 2. Map overdue status for sorting
    const overdueThreshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    result = result.map(c => ({
      ...c,
      isOverdue: c.status === 'OPEN' && new Date(c.createdAt) < overdueThreshold
    }));

    // 3. Sort: Overdue first, then by date descending
    result.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [complaints, filterStatus, filterCategory, filterDate]);

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage society operations and resident requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNoticeForm(true)}>
          <Bell size={18} style={{ marginRight: '0.5rem' }} /> Post Notice
        </button>
      </div>

      {/* Metrics Section */}
      {metrics && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '1.5rem' }}>
            <div className="card glass-panel flex items-center justify-between" style={{ padding: '1.5rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>TOTAL COMPLAINTS</p>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>{metrics.totalComplaints}</h2>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '50%' }}>
                <BarChart2 color="var(--primary)" />
              </div>
            </div>
            <div className="card glass-panel flex items-center justify-between" style={{ padding: '1.5rem', border: '1px solid #fca5a5' }}>
              <div>
                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}>OVERDUE (3+ DAYS)</p>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--danger)' }}>{metrics.overdueCount}</h2>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '50%' }}>
                <AlertTriangle color="var(--danger)" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>By Status</h3>
              <div className="flex gap-4">
                {metrics.byStatus.map(s => (
                  <div key={s.status} style={{ textAlign: 'center', flex: 1, backgroundColor: 'var(--background)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{s.status.replace('_', ' ')}</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{s._count.status}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>By Category</h3>
              <div className="flex flex-wrap gap-2">
                {metrics.byCategory.map(c => (
                  <span key={c.category} className="badge badge-low" style={{ padding: '0.5rem 1rem' }}>
                    {c.category}: <strong>{c._count.category}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice Form Modal */}
      {showNoticeForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
            <h3>Post Notice</h3>
            <form onSubmit={handleSubmitNotice} style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Title</label>
                <input type="text" className="input-field" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Content</label>
                <textarea className="input-field" rows="4" value={noticeContent} onChange={e => setNoticeContent(e.target.value)} required></textarea>
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="important" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} />
                <label htmlFor="important" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--danger)' }}>Mark as Important (Pins to top & Sends Email)</label>
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNoticeForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingNotice}>Post Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Complaint Modal */}
      {selectedComplaint && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
            <h3>Update Complaint #{selectedComplaint.id}</h3>
            <form onSubmit={handleUpdateComplaint} style={{ marginTop: '1rem' }}>
              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="label">Status</label>
                  <select className="input-field" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}>
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input-field" value={updatePriority} onChange={e => setUpdatePriority(e.target.value)}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Note (Optional)</label>
                <textarea className="input-field" rows="3" value={updateNote} onChange={e => setUpdateNote(e.target.value)} placeholder="Reason for update..."></textarea>
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedComplaint(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaints Table */}
      <div className="card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center">
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>All Complaints</h2>
            
            {/* Filters */}
            <div className="flex gap-4">
              <select className="input-field" style={{ width: '150px' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
              
              <select className="input-field" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <input type="date" className="input-field" style={{ width: '150px' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>ID</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Resident</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Category</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Priority</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedComplaints.map(c => {
                return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: c.isOverdue ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>#{c.id}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{c.resident.name}</p>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{c.resident.email}</p>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{c.category}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{getPriorityBadge(c.priority)}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span className={`badge ${c.status === 'OPEN' ? 'badge-open' : c.status === 'IN_PROGRESS' ? 'badge-progress' : 'badge-resolved'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    {c.isOverdue && <span className="badge badge-high" style={{ marginLeft: '0.5rem' }}>OVERDUE</span>}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => {
                      setSelectedComplaint(c);
                      setUpdateStatus(c.status);
                      setUpdatePriority(c.priority);
                      setUpdateNote('');
                    }}>
                      <Settings size={14} style={{ marginRight: '0.25rem' }} /> Manage
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {filteredAndSortedComplaints.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No complaints found matching criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
