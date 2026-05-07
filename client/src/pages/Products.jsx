import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Search, Plus, Package, Edit, Trash2, ArrowLeftRight } from 'lucide-react';
import ProductForm from '../components/ui/ProductForm';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useContext(AuthContext);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await api.get('/locations');
        setLocations(data);
      } catch (e) { console.error(e); }
    };
    fetchLocations();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products?search=${search}`);
      setProducts(data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (product = null) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setProductToEdit(null);
    setIsFormOpen(false);
  };

  const handleSaveForm = () => {
    handleCloseForm();
    fetchProducts();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        alert('Error al eliminar el producto');
      }
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ margin: 0 }}>Inventario de Productos</h1>
        </div>
        
        {['ADMIN', 'MANAGER'].includes(user?.role) && (
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={() => setIsCategoryManagerOpen(true)} style={{ gap: '0.5rem' }}>
              <Package size={18} /> Gestionar Categorías
            </button>
            <button className="btn btn-secondary" onClick={() => setIsTransferOpen(true)} style={{ gap: '0.5rem' }}>
              <ArrowLeftRight size={18} /> Transferir Stock
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenForm()}>
              <Plus size={18} /> Nuevo Producto
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Barra de Herramientas */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, SKU o EAN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto', flex: 1 }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-table-header)' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500 }}>Producto</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500 }}>SKU / EAN</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500 }}>Stock Disponible</th>
                
                {['ADMIN', 'MANAGER'].includes(user?.role) && (
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500 }}>Costo (USD)</th>
                )}
                
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500 }}>Precio de Venta</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Cargando inventario...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron productos</td></tr>
              ) : (
                products.map((p) => {
                  const totalStock = p.stockByLocation?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                  const isLowStock = totalStock <= p.minStock;
                  
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} color="var(--brand-primary)" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {p.subCategory ? `${p.subCategory.category.name} > ${p.subCategory.name}` : 'Sin categoría'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        <div style={{ color: 'var(--brand-primary)' }}>{p.sku}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{p.ean || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          fontWeight: 700, 
                          fontSize: '1.1rem',
                          color: isLowStock ? 'var(--warning)' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {totalStock}
                          {isLowStock && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' }}></div>}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                          {p.stockByLocation?.filter(s => s.quantity > 0).map(s => (
                            <div key={s.locationId} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '4px' }}>
                              <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{s.quantity}</span>
                              <span>en {s.location.name}</span>
                            </div>
                          ))}
                          {totalStock === 0 && <div style={{ fontSize: '0.7rem', color: 'var(--danger)', opacity: 0.7 }}>Sin stock físico</div>}
                        </div>

                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Mín: {p.minStock}</div>
                      </td>
                      
                      {['ADMIN', 'MANAGER'].includes(user?.role) && (
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{formatUSD(p.costUsd || 0)}</td>
                      )}
                      
                      <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--success)' }}>{formatCurrency(p.salePrice || 0)}</td>
                    
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        {['ADMIN', 'MANAGER'].includes(user?.role) && (
                          <>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => handleOpenForm(p)}>
                              <Edit size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger-bg)' }} onClick={() => handleDelete(p.id, p.name)}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
      
      {isFormOpen && (
        <ProductForm 
          product={productToEdit} 
          onClose={handleCloseForm} 
          onSave={handleSaveForm} 
        />
      )}

      {isTransferOpen && (
        <TransferModal 
          products={products}
          locations={locations}
          onClose={() => setIsTransferOpen(false)}
          onSuccess={() => { setIsTransferOpen(false); fetchProducts(); }}
        />
      )}

      {isCategoryManagerOpen && (
        <CategoryManagerModal 
          onClose={() => { setIsCategoryManagerOpen(false); fetchProducts(); }} 
        />
      )}
    </div>
  );
};

// Modal de Transferencia de Stock
const TransferModal = ({ products, locations, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    productId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: 1,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = products.find(p => p.id === Number(form.productId));
  const availableStock = selectedProduct?.stockByLocation?.find(s => s.locationId === Number(form.fromLocationId))?.quantity || 0;

  const handleSubmit = async () => {
    if (!form.productId || !form.fromLocationId || !form.toLocationId) return setError('Completá todos los campos');
    if (form.fromLocationId === form.toLocationId) return setError('Origen y destino deben ser distintos');
    if (form.quantity <= 0 || form.quantity > availableStock) return setError(`Cantidad inválida. Máximo disponible: ${availableStock}`);

    setLoading(true);
    setError('');
    try {
      await api.post('/transfers', form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al realizar la transferencia');
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '2rem', animation: 'scaleUp 0.3s ease-out' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ArrowLeftRight size={28} color="var(--brand-primary)" />
          Transferir Stock
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Mover mercadería de un depósito/tienda a otro.</p>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#FCA5A5', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5">
          <div>
            <label>Producto *</label>
            <select value={form.productId} onChange={e => setForm({...form, productId: e.target.value, fromLocationId: '', quantity: 1})}>
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label>Origen *</label>
              <select value={form.fromLocationId} onChange={e => setForm({...form, fromLocationId: e.target.value, quantity: 1})}>
                <option value="">Desde...</option>
                {locations.map(l => {
                  const stockHere = selectedProduct?.stockByLocation?.find(s => s.locationId === l.id)?.quantity || 0;
                  return (
                    <option key={l.id} value={l.id} disabled={stockHere <= 0}>
                      {l.name} ({stockHere} uds)
                    </option>
                  );
                })}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Destino *</label>
              <select value={form.toLocationId} onChange={e => setForm({...form, toLocationId: e.target.value})}>
                <option value="">Hacia...</option>
                {locations.filter(l => String(l.id) !== String(form.fromLocationId)).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label>Cantidad * (Máx: {availableStock})</label>
              <input 
                type="number" min="1" max={availableStock}
                value={form.quantity}
                onChange={e => setForm({...form, quantity: Number(e.target.value)})}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Notas (Opcional)</label>
              <input 
                type="text" 
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Ej: Reposición para fin de semana"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancelar</button>
            <button className="btn btn-primary" style={{ flex: 2, padding: '0.8rem' }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Transferencia'}
            </button>
          </div>
        </div>
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

const CategoryManagerModal = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`¿Seguro que querés eliminar la categoría "${name}"? Se borrarán también sus subcategorías. No podés borrar categorías que tengan productos.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || "Error al eliminar la categoría. Asegurate de que no tenga productos asociados.");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ margin: 0 }}>Gestionar Categorías</h2>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? <p>Cargando...</p> : categories.length === 0 ? <p>No hay categorías.</p> : (
            <div className="flex flex-col gap-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {cat.subCategories?.length || 0} subcategorías
                    </div>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem', color: 'var(--danger)' }}
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
