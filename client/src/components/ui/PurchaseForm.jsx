import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ShoppingCart, DollarSign } from 'lucide-react';
import api from '../../services/api';

const PurchaseForm = ({ onClose, onSave, initialData }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    supplierId: initialData?.supplierId || '',
    notes: initialData?.notes || '',
    items: initialData?.items?.map(i => ({
      productId: i.productId,
      name: i.product?.name || '',
      qtyOrdered: i.qtyOrdered,
      unitCostUsd: i.unitCostUsd
    })) || []
  });

  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppRes, prodRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products')
        ]);
        setSuppliers(suppRes.data);
        setProducts(prodRes.data.data); // Asumiendo que la paginación devuelve { data: [...] }
      } catch (err) {
        console.error('Error fetching data for PO', err);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === Number(selectedProduct));
    if (!prod) return;

    // Si ya existe en la orden, no lo agregamos de nuevo, le decimos al usuario
    if (formData.items.find(i => i.productId === prod.id)) {
      alert("El producto ya está en la orden.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: prod.id,
        name: prod.name,
        qtyOrdered: 1,
        unitCostUsd: prod.costUsd || 0
      }]
    }));
    setSelectedProduct(''); // Resetear el select
  };

  const handleItemChange = (productId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.productId === productId ? { ...item, [field]: Number(value) } : item
      )
    }));
  };

  const handleRemoveItem = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierId) return setError("Debe seleccionar un proveedor");
    if (formData.items.length === 0) return setError("La orden debe tener al menos un producto");

    setLoading(true);
    setError('');

    try {
      const payload = {
        supplierId: formData.supplierId,
        notes: formData.notes,
        items: formData.items.map(i => ({
          productId: i.productId,
          qtyOrdered: i.qtyOrdered,
          unitCostUsd: i.unitCostUsd
        }))
      };

      if (initialData?.id) {
        await api.put(`/purchases/${initialData.id}`, payload);
      } else {
        await api.post('/purchases', payload);
      }
      onSave(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la Orden de Compra');
    } finally {
      setLoading(false);
    }
  };

  const totalOrder = formData.items.reduce((acc, curr) => acc + (curr.qtyOrdered * curr.unitCostUsd), 0);
  const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '800px', height: '100%', 
        borderRight: 'none', borderTop: 'none', borderBottom: 'none',
        borderRadius: '24px 0 0 24px', display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
        
        {/* Header Premium */}
        <div className="flex justify-between items-center" style={{ 
          padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(to right, rgba(15,23,42,0.8), rgba(30,41,59,0.8))'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingCart size={24} color="var(--brand-primary)" />
              {initialData ? 'Editar Orden de Compra' : 'Generar Orden de Compra'}
            </h2>
            <p style={{ margin: 0, marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {initialData ? `Modificando Orden #${String(initialData.id).padStart(5, '0')}` : 'Solicitud de mercadería a proveedor'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {error && (
            <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#FCA5A5', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form id="purchaseForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Datos Generales</h3>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label>Proveedor *</label>
                  <select required name="supplierId" value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Seleccione un proveedor...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Notas Adicionales</label>
                  <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Ej. Envío por transporte rápido" />
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Mercadería Solicitada</h3>
              
              <div className="flex gap-2 mb-4">
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Buscar producto para agregar al pedido...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stock actual: {p.stockByLocation?.reduce((a,c)=>a+c.quantity,0)||0})</option>)}
                </select>
                <button type="button" className="btn btn-secondary" onClick={handleAddItem} style={{ padding: '0 1rem' }}>
                  <Plus size={18} /> Agregar
                </button>
              </div>

              {formData.items.length > 0 ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-table-header)' }}>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRODUCTO</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CANTIDAD</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>COSTO UNIT. (USD)</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SUBTOTAL</th>
                        <th style={{ padding: '0.75rem 1rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item) => (
                        <tr key={item.productId} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                          <td style={{ padding: '1rem' }}>
                            <input 
                              type="number" min="1" 
                              value={item.qtyOrdered} 
                              onChange={(e) => handleItemChange(item.productId, 'qtyOrdered', e.target.value)}
                              style={{ width: '80px', padding: '0.4rem', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }} 
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input 
                              type="number" step="0.01" 
                              value={item.unitCostUsd} 
                              onChange={(e) => handleItemChange(item.productId, 'unitCostUsd', e.target.value)}
                              style={{ width: '100px', padding: '0.4rem', textAlign: 'right', backgroundColor: 'rgba(0,0,0,0.3)' }} 
                            />
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--info)' }}>
                            {formatUSD(item.qtyOrdered * item.unitCostUsd)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button type="button" onClick={() => handleRemoveItem(item.productId)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  No has agregado productos a la orden.
                </div>
              )}

            </div>
          </form>
        </div>

        {/* Footer Premium con Totales */}
        <div style={{ 
          padding: '1.5rem 2rem', 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'rgba(15,23,42,0.9)'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Estimado</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <DollarSign size={24} />
              {totalOrder.toFixed(2)}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading} style={{ padding: '0.8rem 1.5rem' }}>
              Cancelar
            </button>
            <button type="submit" form="purchaseForm" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 2rem', fontSize: '1.05rem', boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}>
              {loading ? 'Procesando...' : 'Emitir Orden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;
