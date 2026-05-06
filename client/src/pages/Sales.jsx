import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, User as UserIcon, MapPin, CheckCircle2 } from 'lucide-react';

const Sales = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) fetchProducts(search);
      else setProducts([]);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchInitialData = async () => {
    try {
      const [locRes, custRes] = await Promise.all([
        api.get('/locations'),
        api.get('/customers')
      ]);
      setLocations(locRes.data);
      if (locRes.data.length > 0) setSelectedLocation(locRes.data[0].id);
      setCustomers(custRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchProducts = async (searchTerm) => {
    try {
      const { data } = await api.get(`/products?search=${searchTerm}&limit=10`);
      setProducts(data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addToCart = (product) => {
    if (!selectedLocation) {
      alert('Por favor, selecciona un depósito/tienda primero.');
      return;
    }

    // Verificar stock disponible en la locación seleccionada
    const stockInLocation = product.stockByLocation?.find(s => s.locationId === Number(selectedLocation))?.quantity || 0;
    
    if (stockInLocation <= 0) {
      alert('No hay stock disponible en el depósito seleccionado.');
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= stockInLocation) {
         alert('No hay más stock disponible para agregar.');
         return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        unitPrice: product.salePrice, 
        quantity: 1,
        maxStock: stockInLocation
      }]);
    }
    setSearch('');
    setProducts([]);
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0 && newQuantity <= item.maxStock) {
          return { ...item, quantity: newQuantity };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('El carrito está vacío');
    if (!selectedLocation) return alert('Selecciona un depósito/tienda');

    setLoading(true);
    try {
      const payload = {
        locationId: Number(selectedLocation),
        customerId: selectedCustomer ? Number(selectedCustomer) : null,
        paymentMethod,
        source: 'LOCAL',
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      await api.post('/sales', payload);
      setSuccess(true);
      setCart([]);
      setSearch('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <div className="flex gap-6 h-full relative">
      
      {/* Sección Izquierda: Búsqueda de Productos */}
      <div className="flex flex-col gap-4 flex-1 h-full">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={24} color="var(--brand-primary)" /> Punto de Venta (POS)
          </h1>
          
          <div className="flex gap-4 mb-4">
            <div style={{ flex: 1 }}>
              <label><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }}/> Vender desde Depósito/Tienda:</label>
              <select 
                value={selectedLocation} 
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCart([]); // Limpiar carrito si cambian la sucursal porque el stock cambia
                }}
              >
                <option value="">Seleccione una ubicación...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label><UserIcon size={14} style={{ display: 'inline', marginRight: '4px' }}/> Cliente (Opcional):</label>
              <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                <option value="">Consumidor Final</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '1.1rem', padding: '1rem 1rem 1rem 2.5rem' }}
              disabled={!selectedLocation}
            />
          </div>
        </div>

        {/* Resultados de Búsqueda */}
        <div className="glass-panel flex-1 overflow-y-auto" style={{ padding: '1rem' }}>
          {products.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {products.map(product => {
                const stockInLocation = product.stockByLocation?.find(s => s.locationId === Number(selectedLocation))?.quantity || 0;
                const isOutOfStock = stockInLocation <= 0;

                return (
                  <div 
                    key={product.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '1rem', 
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.5 : 1,
                      border: '1px solid rgba(255,255,255,0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    onMouseEnter={(e) => { if (!isOutOfStock) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
                    onMouseLeave={(e) => { if (!isOutOfStock) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; } }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>{product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SKU: {product.sku}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(product.salePrice)}</div>
                      <div style={{ fontSize: '0.75rem', color: isOutOfStock ? 'var(--danger)' : 'var(--brand-primary)', fontWeight: 600 }}>
                        Stock: {stockInLocation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : search ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron productos.</div>
          ) : (
             <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Busca un producto para agregarlo al carrito.</div>
          )}
        </div>
      </div>

      {/* Sección Derecha: Carrito */}
      <div className="glass-panel flex flex-col" style={{ width: '400px', height: '100%', borderLeft: '1px solid var(--border-color)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-table-header)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Carrito actual</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
              El carrito está vacío
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map(item => (
                <div key={item.productId} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, paddingRight: '1rem' }}>{item.name}</div>
                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(item.unitPrice * item.quantity)}</div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.25rem' }}>
                      <button 
                        onClick={() => updateQuantity(item.productId, -1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ width: '20px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, 1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-table-header)' }}>
          <div className="flex justify-between items-center mb-4">
            <div style={{ color: 'var(--text-muted)' }}>Método de Pago:</div>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: 'auto', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta (Crédito/Débito)</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          <div className="flex justify-between items-end mb-6">
            <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Total</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{formatCurrency(total)}</div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600 }}
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
          >
            {loading ? 'Procesando...' : 'Completar Venta'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <CheckCircle2 size={40} color="var(--success)" />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>¡Venta Exitosa!</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>El stock ha sido descontado correctamente.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
