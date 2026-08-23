import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, User, Bell } from 'lucide-react';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={24} /> SocietyApp
          </h2>
        </div>
        
        <div style={{ padding: '1.5rem', flex: 1 }}>
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LOGGED IN AS</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</p>
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`btn ${location.pathname.includes(user.role.toLowerCase()) ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', width: '100%' }}
              onClick={() => navigate(`/${user.role.toLowerCase()}`)}
            >
              <User size={18} style={{ marginRight: '0.5rem' }} /> Dashboard
            </button>
          </nav>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-secondary" style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleLogout}>
            <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: 'var(--background)', overflowY: 'auto' }}>
        <div style={{ padding: '2rem' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
