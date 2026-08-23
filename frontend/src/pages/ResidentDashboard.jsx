import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

function ResidentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [complaintsRes, noticesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/complaints', { headers }),
        axios.get('http://localhost:5000/api/notices', { headers })
      ]);
      
      setComplaints(complaintsRes.data);
      setNotices(noticesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('category', category);
    formData.append('description', description);
    if (photo) formData.append('photo', photo);

    try {
      await axios.post('http://localhost:5000/api/complaints', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowForm(false);
      setDescription('');
      setPhoto(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'OPEN': return <span className="badge badge-open"><AlertCircle size={12} className="mr-1" /> Open</span>;
      case 'IN_PROGRESS': return <span className="badge badge-progress"><Clock size={12} className="mr-1" /> In Progress</span>;
      case 'RESOLVED': return <span className="badge badge-resolved"><CheckCircle2 size={12} className="mr-1" /> Resolved</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Resident Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your complaints and view notices.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> Raise Complaint
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3>New Complaint</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Carpentry</option>
                  <option>Cleaning</option>
                  <option>Security</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Photo (Optional)</label>
                <input type="file" className="input-field" onChange={e => setPhoto(e.target.files[0])} accept="image/*" />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Description</label>
              <textarea 
                className="input-field" 
                rows="4" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
                placeholder="Describe the issue in detail..."
              ></textarea>
            </div>
            <div className="flex justify-between">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Complaints List */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Complaints</h2>
          {complaints.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>You have not raised any complaints yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {complaints.map(complaint => (
                <div key={complaint.id} className="card" style={{ padding: '1.5rem' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <div className="flex items-center gap-4">
                      <span style={{ fontWeight: 600 }}>#{complaint.id}</span>
                      <span className="badge badge-low">{complaint.category}</span>
                    </div>
                    {getStatusBadge(complaint.status)}
                  </div>
                  <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>{complaint.description}</p>
                  
                  {complaint.photoUrl && (
                    <div style={{ marginBottom: '1rem' }}>
                      <img src={`http://localhost:5000${complaint.photoUrl}`} alt="Complaint" style={{ maxWidth: '200px', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <p>Raised on: {new Date(complaint.createdAt).toLocaleString()}</p>
                    {complaint.history && complaint.history.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>History:</strong>
                        <ul style={{ paddingLeft: '1rem' }}>
                          {complaint.history.map(h => (
                            <li key={h.id}>
                              Changed to {h.newStatus} on {new Date(h.createdAt).toLocaleDateString()}
                              {h.note && ` - Note: ${h.note}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notice Board */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Notice Board</h2>
          <div className="flex flex-col gap-4">
            {notices.map(notice => (
              <div key={notice.id} className="card" style={{ padding: '1.5rem', borderLeft: notice.isImportant ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
                {notice.isImportant && (
                  <span className="badge badge-high" style={{ marginBottom: '0.5rem' }}>Important</span>
                )}
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{notice.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{notice.content}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(notice.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {notices.length === 0 && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No notices available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResidentDashboard;
