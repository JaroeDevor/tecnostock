import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';

const SupplierForm = ({ supplier, onClose, onSave }) => {
  const isEditing = !!supplier;
  
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    whatsapp: '',
    email: '',
    address: '',
    leadTimeDays: 7
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: supplier.name || '',
        taxId: supplier.taxId || '',
        whatsapp: supplier.whatsapp || '',
        email: supplier.email || '',
        address: supplier.address || '',
        leadTimeDays: supplier.leadTimeDays || 7
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await api.put(`/suppliers/${supplier.id}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      onSave(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '450px', height: '100%', 
        borderRight: 'none', borderTop: 'none', borderBottom: 'none',
        borderRadius: '24px 0 0 24px', display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out forwards'
      }}>
        
        <div className="flex justify-between items-center" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {error && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: '#FCA5A5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form id="supplierForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label>Razón Social / Nombre *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Tech Imports S.A." />
            </div>

            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label>RUT / Tax ID</label>
                <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} placeholder="Opcional" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Lead Time (Días)</label>
                <input required type="number" name="leadTimeDays" value={formData.leadTimeDays} onChange={handleChange} title="Días que tarda en entregar la mercadería" />
              </div>
            </div>

            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label>WhatsApp</label>
                <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="+54 9 11..." />
              </div>
              <div style={{ flex: 1 }}>
                <label>Correo Electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contacto@empresa.com" />
              </div>
            </div>

            <div>
              <label>Dirección Física</label>
              <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Opcional" rows={3}></textarea>
            </div>
          </form>
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="supplierForm" className="btn btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierForm;
