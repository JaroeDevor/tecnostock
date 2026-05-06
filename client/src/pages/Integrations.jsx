import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingBag, Cloud, CheckCircle2, AlertCircle, Plus, RefreshCw, Power } from 'lucide-react';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  
  const [formData, setFormData] = useState({
    storeName: '',
    accessToken: '',
    syncStock: true
  });

  useEffect(() => {
    fetchIntegrations();
    
    // Revisar si venimos de un redirect de ML (OAuth callback)
    const params = new URLSearchParams(window.location.search);
    if (params.get('ml_auth_success') && params.get('code')) {
      handleMlCallback(params.get('code'));
    }
  }, []);

  const handleMlCallback = async (code) => {
    try {
      setLoading(true);
      await api.post('/integrations/ml/callback', { code, storeName: 'Mercado Libre Oficial' });
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchIntegrations();
      alert('¡Mercado Libre conectado exitosamente mediante OAuth!');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al autorizar con Mercado Libre');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/integrations');
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('¿Seguro que deseas desconectar esta plataforma? Se detendrá la sincronización de stock.')) return;
    try {
      setLoading(true);
      await api.delete(`/integrations/${id}`);
      fetchIntegrations();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al desconectar');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      await api.post('/integrations', {
        platform: selectedPlatform,
        ...formData
      });
      setShowModal(false);
      setFormData({ storeName: '', accessToken: '', syncStock: true });
      fetchIntegrations();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al conectar');
    }
  };

  const handleSync = async (integrationId) => {
    try {
      const { data } = await api.post(`/integrations/${integrationId}/sync`);
      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al forzar sincronización');
    }
  };

  const getPlatformDetails = (platform) => {
    if (platform === 'MERCADO_LIBRE') {
      return { name: 'Mercado Libre', icon: <ShoppingBag size={40} color="#FFE600" />, color: '#FFE600', text: '#333' };
    }
    return { name: 'Tienda Nube', icon: <Cloud size={40} color="#0052FF" />, color: '#0052FF', text: '#FFF' };
  };

  // Helper to find if a platform is connected
  const getConnectedInfo = (platform) => {
    return integrations.find(i => i.platform === platform);
  };

  const [mappingIntegrationId, setMappingIntegrationId] = useState(null);

  // ... (inside the map for connected integration, add the new button before the bottom row)
  // Wait, I will just replace the entire return block for the connected platform part to insert the button, and add MappingModal at the bottom.
  // Actually, let me just provide the new component and insert it at the end of the file.

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-8">
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Integraciones y Omnicanalidad</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.25rem' }}>
          Conecta TecnoStock con tus canales de venta online para mantener el inventario sincronizado automáticamente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {['MERCADO_LIBRE', 'TIENDA_NUBE'].map(platform => {
          const details = getPlatformDetails(platform);
          const connected = getConnectedInfo(platform);

          return (
            <div key={platform} className="glass-panel" style={{ 
              padding: '2rem', display: 'flex', flexDirection: 'column',
              borderTop: `4px solid ${details.color}`
            }}>
              <div className="flex justify-between items-start mb-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                    {details.icon}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{details.name}</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {platform === 'MERCADO_LIBRE' ? 'Sincroniza publicaciones y ventas del marketplace más grande.' : 'Conecta tu tienda online y unifica el stock.'}
                    </p>
                  </div>
                </div>
                
                {connected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem', background: 'var(--success-bg)', padding: '0.5rem 1rem', borderRadius: '30px' }}>
                    <CheckCircle2 size={16} /> Conectado
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '30px' }}>
                    <AlertCircle size={16} /> Desconectado
                  </div>
                )}
              </div>

              {connected ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Nombre de la Tienda</div>
                    <div style={{ fontWeight: 600 }}>{connected.storeName}</div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Sincronización de Stock</div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: connected.syncStock ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                        <RefreshCw size={16} /> {connected.syncStock ? 'Activada' : 'Pausada'}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Productos Vinculados</div>
                      <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{connected._count?.productMappings || 0}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
                      onClick={() => setMappingIntegrationId(connected.id)}
                    >
                      Mapear Productos
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => handleSync(connected.id)}
                    >
                      <RefreshCw size={18} /> Forzar Sincronización
                    </button>
                    <button 
                      className="btn" 
                      style={{ flex: 1, background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => handleDisconnect(connected.id)}
                    >
                      <Power size={18} /> Desconectar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem 0', gap: '1.5rem' }}>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', maxWidth: '300px' }}>
                    Vincula tu cuenta para que TecnoStock controle el inventario de esta plataforma.
                  </p>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.8rem 2rem', gap: '0.75rem', background: details.color, color: details.text }}
                    onClick={() => { 
                      if (platform === 'MERCADO_LIBRE') {
                        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/integrations/ml/auth`;
                      } else {
                        setSelectedPlatform(platform); 
                        setShowModal(true); 
                      }
                    }}
                  >
                    <Plus size={20} /> Conectar Cuenta
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Conectar {getPlatformDetails(selectedPlatform).name}</h2>
            <form onSubmit={handleConnect} className="flex flex-col gap-4 mt-4">
              <div>
                <label>Nombre de la Tienda (Ej: MiLocal Oficial)</label>
                <input required type="text" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} placeholder="Nombre identificatorio" />
              </div>
              
              <div>
                <label>Token de Acceso (Access Token / API Key)</label>
                <input required type="password" value={formData.accessToken} onChange={e => setFormData({...formData, accessToken: e.target.value})} placeholder="Pega el token aquí..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="syncStock" 
                  checked={formData.syncStock} 
                  onChange={e => setFormData({...formData, syncStock: e.target.checked})}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="syncStock" style={{ margin: 0, cursor: 'pointer', fontWeight: 500 }}>
                  Sincronizar Stock Automáticamente
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Al activar, las ventas restarán stock aquí y viceversa.</div>
                </label>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: getPlatformDetails(selectedPlatform).color, color: getPlatformDetails(selectedPlatform).text }}>
                  Vincular Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mappingIntegrationId && (
        <MappingModal 
          integrationId={mappingIntegrationId} 
          onClose={() => { setMappingIntegrationId(null); fetchIntegrations(); }} 
        />
      )}
    </div>
  );
};

// Componente para mapear productos
const MappingModal = ({ integrationId, onClose }) => {
  const [products, setProducts] = useState([]);
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, mapRes] = await Promise.all([
          api.get('/products'),
          api.get(`/integrations/${integrationId}/mappings`)
        ]);
        
        setProducts(prodRes.data.data);
        
        const initialMappings = {};
        mapRes.data.forEach(m => {
          initialMappings[m.productId] = m.externalId;
        });
        setMappings(initialMappings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [integrationId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = Object.entries(mappings).map(([productId, externalId]) => ({
        productId: Number(productId),
        externalId
      }));
      
      await api.post(`/integrations/${integrationId}/mappings`, { mappings: payload });
      alert('Mapeos guardados correctamente');
      onClose();
    } catch (err) {
      alert('Error al guardar mapeos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '2rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0 }}>Mapeo de Productos</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Ingresa el ID de la plataforma externa (ej. MLA123...) para vincularlos.</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {loading ? (
            <p>Cargando productos...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem' }}>SKU Interno</th>
                  <th style={{ padding: '0.5rem' }}>Nombre</th>
                  <th style={{ padding: '0.5rem' }}>ID Externo (ML/TN)</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--brand-primary)' }}>{p.sku}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="Ej. MLA..." 
                        value={mappings[p.id] || ''} 
                        onChange={e => setMappings({...mappings, [p.id]: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar Mapeos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
