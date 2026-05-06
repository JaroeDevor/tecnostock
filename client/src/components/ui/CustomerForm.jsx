import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';

const CustomerForm = ({ customer, onClose, onSave }) => {
  const isEditing = !!customer;
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

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
        await api.put(`/customers/${customer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      onSave(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el cliente');
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
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
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

          <form id="customerForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label>Nombre Completo / Empresa *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Juan Pérez" />
            </div>

            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label>Teléfono</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Opcional" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Correo Electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Opcional" />
              </div>
            </div>

            <div>
              <label>Dirección</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Opcional" />
            </div>

            <div>
              <label>Notas / Historial</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Ej. Cliente mayorista..." rows={4}></textarea>
            </div>
          </form>
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="customerForm" className="btn btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
