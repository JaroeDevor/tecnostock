import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard, PackageSearch, Users, Truck, ShoppingCart, Link as LinkIcon, BarChart3, Store, Plus, MapPin, Building, Menu, Moon, Sun } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [locations, setLocations] = useState([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('tecnostock_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tecnostock_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchLocations = async () => {
    try {
      const { data } = await api.get('/locations');
      setLocations(data);
    } catch (e) { console.error('Error fetching locations:', e); }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'POS (Ventas)', path: '/dashboard/sales', icon: <ShoppingCart size={18} /> },
    { name: 'Productos', path: '/dashboard/products', icon: <PackageSearch size={18} /> },
    { name: 'Proveedores', path: '/dashboard/suppliers', icon: <Truck size={18} />, hidden: user?.role === 'SELLER' },
    { name: 'Clientes', path: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'Compras', path: '/dashboard/purchases', icon: <ShoppingCart size={18} />, hidden: user?.role === 'SELLER' },
    { name: 'Reportes', path: '/dashboard/reports', icon: <BarChart3 size={18} />, hidden: user?.role === 'SELLER' },
    { name: 'Integraciones', path: '/dashboard/integrations', icon: <LinkIcon size={18} />, hidden: user?.role !== 'ADMIN' },
  ];

  return (
    <div className="app-container">


      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="header" style={{ borderBottomColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-between', paddingRight: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--brand-primary)' }}>Tecno</span>Stock
          </h2>
          <button className="mobile-toggle" style={{ display: 'flex' }} onClick={() => setIsSidebarOpen(false)}>
            <Menu size={24} />
          </button>
        </div>
        
        <div style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.filter(item => !item.hidden).map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.path}
                onClick={() => { navigate(item.path); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}
                className="btn" 
                style={{ 
                  width: '100%', 
                  justifyContent: 'flex-start', 
                  backgroundColor: isActive ? 'var(--brand-primary-light)' : 'transparent', 
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                {item.icon} {item.name}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Rol: {user?.role}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header justify-between" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isSidebarOpen && (
              <button className="mobile-toggle" style={{ display: 'flex' }} onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
              </button>
            )}
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span className="unit-full">TecnoMovil Distribuciones</span>
              <span className="unit-short">TecnoMovil</span>
              <div className="unit-full" style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
              
              {/* Locales Activos */}
              <div className="flex items-center gap-2">
              <Store size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '4px' }}>Locales Activos:</span>
              <div className="flex gap-2">
                {locations.map(loc => (
                  <div key={loc.id} style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '12px', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    color: 'var(--text-muted)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {loc.type === 'WAREHOUSE' ? <Building size={12} color="var(--brand-primary-light)" /> : <Store size={12} color="var(--brand-primary-light)" />}
                    {loc.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={toggleTheme} 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              title="Cambiar Tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {['ADMIN', 'MANAGER'].includes(user?.role) && (
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsLocationModalOpen(true)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem', border: '1px dashed rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> <span className="unit-full">Agregar Local</span><span className="unit-short">Local</span>
              </button>
            )}
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Modal Agregar Local */}
      {isLocationModalOpen && (
        <NewLocationModal 
          onClose={() => setIsLocationModalOpen(false)} 
          onSuccess={() => { setIsLocationModalOpen(false); fetchLocations(); }} 
        />
      )}
    </div>
  );
};

// Componente Interno para crear un local nuevo
const NewLocationModal = ({ onClose, onSuccess }) => {
  const [data, setData] = useState({ name: '', type: 'STORE', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.name) return setError('El nombre es obligatorio');
    
    setLoading(true);
    try {
      await api.post('/locations', data);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la sucursal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', animation: 'scaleUp 0.3s ease-out' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MapPin size={28} color="var(--brand-primary)" />
          Nueva Ubicación
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Agregá una nueva tienda o depósito a la red.</p>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#FCA5A5', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label>Nombre del Local *</label>
            <input 
              required type="text" 
              value={data.name} 
              onChange={e => setData({...data, name: e.target.value})} 
              placeholder="Ej: Tienda Unicenter"
            />
          </div>

          <div>
            <label>Tipo de Instalación</label>
            <select value={data.type} onChange={e => setData({...data, type: e.target.value})}>
              <option value="STORE">Tienda Comercial (Punto de Venta)</option>
              <option value="WAREHOUSE">Almacén Central / Depósito</option>
            </select>
          </div>

          <div>
            <label>Dirección Física (Opcional)</label>
            <input 
              type="text" 
              value={data.address} 
              onChange={e => setData({...data, address: e.target.value})} 
              placeholder="Ej: Av. Santa Fe 3200"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Creando...' : 'Crear Ubicación'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
