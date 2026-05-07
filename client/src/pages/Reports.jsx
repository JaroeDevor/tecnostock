import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, Search, Filter, MapPin, TrendingUp } from 'lucide-react';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    productId: '',
    from: '',
    to: ''
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products');
        setProducts(data.data);
      } catch (e) { console.error(e); }
    };
    fetchProducts();
    fetchReport();
  }, []);

  const fetchReport = async (overrideFilters) => {
    setLoading(true);
    try {
      const f = overrideFilters || filters;
      const params = new URLSearchParams();
      if (f.productId) params.append('productId', f.productId);
      if (f.from) params.append('from', f.from);
      if (f.to) params.append('to', f.to);

      const { data } = await api.get(`/reports/sales-by-product?${params.toString()}`);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => fetchReport();

  const handleClear = () => {
    const cleared = { productId: '', from: '', to: '' };
    setFilters(cleared);
    fetchReport(cleared);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Calcular max revenue para las barras de proporción
  const maxRevenue = reportData.length > 0 ? Math.max(...reportData.map(r => r.totalRevenue)) : 1;

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 size={28} color="var(--brand-primary)" /> Reportes de Ventas
        </h1>
      </div>

      {/* Filtros */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="flex gap-4 items-end" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '250px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={14} /> Filtrar por Producto</label>
            <select value={filters.productId} onChange={e => setFilters({...filters, productId: e.target.value})}>
              <option value="">Todos los productos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label>Desde</label>
            <input type="date" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label>Hasta</label>
            <input type="date" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleFilter} style={{ gap: '0.5rem', padding: '0.7rem 1.5rem' }}>
              <Filter size={16} /> Filtrar
            </button>
            <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '0.7rem 1rem' }}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {reportData.length} producto{reportData.length !== 1 ? 's' : ''} con ventas registradas
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Ordenados por ingresos (mayor a menor)
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando reporte...</div>
          ) : reportData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <BarChart3 size={48} opacity={0.3} style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-primary)' }}>Sin datos de ventas</h3>
              <p>No se encontraron ventas con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reportData.map(item => (
                <div key={item.product.id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SKU: {item.product.sku}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--success)' }}>{formatCurrency(item.totalRevenue)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span className="unit-full">Unidades vendidas: </span>
                        <span className="unit-short">U. vendidas: </span>
                        {item.totalQty}
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de proporción del total */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(item.totalRevenue / maxRevenue) * 100}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--brand-primary), var(--success))',
                      borderRadius: '10px',
                      transition: 'width 0.5s ease-out'
                    }}></div>
                  </div>

                  {/* Desglose por locación */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(item.byLocation.length, 4)}, 1fr)`, gap: '0.75rem' }}>
                    {item.byLocation.map(loc => (
                      <div key={loc.location.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem' }}>
                          <MapPin size={12} /> {loc.location.name}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap' }}>
                            <span className="unit-full">Unidades: </span>
                            <span className="unit-short">U: </span>
                            {loc.qty}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                            {formatCurrency(loc.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
