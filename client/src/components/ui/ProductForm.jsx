import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';

const ProductForm = ({ product, onClose, onSave }) => {
  const isEditing = !!product;
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    ean: '',
    costUsd: 0,
    salePrice: 0,
    minStock: 0,
    currentStock: 0,
    subCategoryId: '',
    locationId: ''
  });

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para creación rápida de categoría
  const [showQuickCat, setShowQuickCat] = useState(false);
  const [quickCat, setQuickCat] = useState({ catName: '', subName: '' });

  // Cargar categorías y depósitos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations')
        ]);
        setCategories(catRes.data);
        setLocations(locRes.data);
      } catch (err) {
        console.error("Error al cargar datos iniciales", err);
      }
    };
    fetchData();
    
    if (isEditing) {
      const totalStock = product.stockByLocation?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
      // Usar el primer locationId donde haya stock, o vacío
      const locId = product.stockByLocation?.length > 0 ? product.stockByLocation[0].locationId : '';
      
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        ean: product.ean || '',
        costUsd: product.costUsd || 0,
        salePrice: product.salePrice || 0,
        minStock: product.minStock || 0,
        currentStock: totalStock,
        subCategoryId: product.subCategoryId || '',
        locationId: locId
      });
    }
  }, [product, isEditing]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (error) {
      console.error("Error al cargar categorías", error);
    }
  };

  const handleQuickCatSave = async () => {
    if (!quickCat.catName.trim()) return alert("El nombre de la categoría es obligatorio");
    const subName = quickCat.subName.trim() || "General";
    
    setLoading(true);
    try {
      // 1. Crear la categoría principal (o buscar si ya existe)
      let catId;
      let existingCat = categories.find(c => c.name.toLowerCase() === quickCat.catName.trim().toLowerCase());
      
      if (existingCat) {
        catId = existingCat.id;
      } else {
        const { data } = await api.post('/categories', { name: quickCat.catName.trim() });
        catId = data.id;
        existingCat = data; // Guardamos la referencia
      }

      // 2. Crear o buscar la subcategoría
      let finalSubId;
      const existingSub = existingCat?.subCategories?.find(s => s.name.toLowerCase() === subName.toLowerCase());

      if (existingSub) {
        finalSubId = existingSub.id;
      } else {
        const { data: subData } = await api.post(`/categories/${catId}/subcategories`, { name: subName });
        finalSubId = subData.id;
      }
      
      // 3. Refrescar lista y seleccionar
      await fetchCategories();
      setFormData(prev => ({ ...prev, subCategoryId: finalSubId }));
      setShowQuickCat(false);
      setQuickCat({ catName: '', subName: '' });
    } catch (err) {
      console.error(err);
      alert("Error al procesar la categoría/subcategoría");
    } finally {
      setLoading(false);
    }
  };

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
        await api.put(`/products/${product.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSave(); // Refresca la tabla y cierra
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el producto');
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
        width: '100%', maxWidth: '500px', height: '100%', 
        borderRight: 'none', borderTop: 'none', borderBottom: 'none',
        borderRadius: '24px 0 0 24px', display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out forwards'
      }}>
        
        {/* Header */}
        <div className="flex justify-between items-center" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {error && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: '#FCA5A5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form id="productForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="flex gap-4">
              <div style={{ flex: 2 }}>
                <label>Nombre del Producto *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Auriculares Sony WH-1000XM5" />
              </div>
            </div>

            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label>SKU Interno *</label>
                <input required type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="Ej. AUD-SONY-01" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Código de Barras (EAN)</label>
                <input type="text" name="ean" value={formData.ean} onChange={handleChange} placeholder="Ej. 750123456789" />
              </div>
            </div>

            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label>Costo (USD) *</label>
                <input required type="number" step="0.01" name="costUsd" value={formData.costUsd} onChange={handleChange} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Precio de Venta (Local) *</label>
                <input required type="number" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label>Stock Actual *</label>
                <input required type="number" name="currentStock" value={formData.currentStock} onChange={handleChange} placeholder="Ej. 50" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Stock Mínimo (Alerta)</label>
                <input required type="number" name="minStock" value={formData.minStock} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label>Categoría *</label>
              <div className="flex gap-2">
                <select required name="subCategoryId" value={formData.subCategoryId} onChange={handleChange} style={{ flex: 1 }}>
                  <option value="">Seleccione una categoría...</option>
                  {categories.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.subCategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0 0.75rem', fontSize: '1.2rem' }}
                  onClick={() => setShowQuickCat(true)}
                  title="Nueva Categoría"
                >
                  +
                </button>
              </div>
            </div>

            {/* Formulario Rápido de Categoría */}
            {showQuickCat && (
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                padding: '1.25rem', 
                borderRadius: '12px', 
                border: '1px solid var(--brand-primary)',
                marginTop: '0.5rem'
              }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--brand-primary)' }}>Nueva Categoría / Subcategoría</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Escribe un nombre nuevo o selecciona una categoría existente para añadirle una subcategoría.</p>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    list="existingCategories"
                    placeholder="Nombre de la Categoría (ej: Audio)" 
                    value={quickCat.catName}
                    onChange={(e) => setQuickCat({...quickCat, catName: e.target.value})}
                  />
                  <datalist id="existingCategories">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name} />
                    ))}
                  </datalist>
                  <input 
                    type="text" 
                    placeholder="Subcategoría (Opcional, ej: Auriculares)" 
                    value={quickCat.subName}
                    onChange={(e) => setQuickCat({...quickCat, subName: e.target.value})}
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setShowQuickCat(false)}>Cancelar</button>
                    <button type="button" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleQuickCatSave}>Crear y Seleccionar</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--brand-primary-light)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} /> Depósito de Inventario *
              </h3>
              <div>
                <select required name="locationId" value={formData.locationId} onChange={handleChange} style={{ borderColor: !formData.locationId ? 'var(--warning)' : 'var(--border-color)' }}>
                  <option value="">Seleccionar Depósito...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type === 'WAREHOUSE' ? 'Almacén' : 'Tienda'})</option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  Es obligatorio seleccionar un depósito para {isEditing ? 'actualizar' : 'cargar'} el stock físico del producto.
                </small>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="productForm" className="btn btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Guardar Producto')}
          </button>
        </div>
        
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ProductForm;
