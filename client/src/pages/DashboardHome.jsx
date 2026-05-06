import { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, Package, AlertTriangle, ShoppingCart, Truck, DollarSign, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ color: 'var(--text-muted)' }}>Cargando métricas...</div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, lowStockAlerts, recentSales } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>Vista General</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Métricas en tiempo real de TecnoStock</p>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        <MetricCard 
          title="Ingresos del Mes" 
          value={formatCurrency(metrics.revenueMonth)} 
          subtitle={`${metrics.salesCountMonth} ventas totales`}
          icon={<DollarSign size={24} color="#10B981" />} 
          color="rgba(16, 185, 129, 0.15)"
        />
        
        <MetricCard 
          title="Ventas de Hoy" 
          value={formatCurrency(metrics.revenueToday)} 
          subtitle={`${metrics.salesCountToday} tickets emitidos`}
          icon={<TrendingUp size={24} color="#0EA5E9" />} 
          color="rgba(14, 165, 233, 0.15)"
        />

        <MetricCard 
          title="Productos Activos" 
          value={metrics.totalProducts} 
          subtitle="En catálogo central"
          icon={<Package size={24} color="#8B5CF6" />} 
          color="rgba(139, 92, 246, 0.15)"
        />

        <MetricCard 
          title="Compras en Tránsito" 
          value={metrics.pendingPurchases} 
          subtitle="Órdenes pendientes de ingreso"
          icon={<Truck size={24} color="#F59E0B" />} 
          color="rgba(245, 158, 11, 0.15)"
        />
      </div>

      {/* Sección de Análisis Financiero */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <TrendingUp size={20} color="var(--success)" /> Análisis de Inversión y Retorno
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>Balance histórico entre compras de mercadería y ventas locales.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rentabilidad Estimada</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: metrics.totalRecovery >= metrics.totalInvestment ? 'var(--success)' : 'var(--warning)' }}>
              {formatCurrency(metrics.totalRecovery - metrics.totalInvestment)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex justify-between items-center">
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Inversión Total (Compras)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(metrics.totalInvestment)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Recupero Total (Ventas)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(metrics.totalRecovery)}</div>
              </div>
            </div>
            
            {/* Barra de progreso de recuperación */}
            <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ 
                width: `${Math.min((metrics.totalRecovery / (metrics.totalInvestment || 1)) * 100, 100)}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--brand-primary), var(--success))',
                borderRadius: '10px',
                transition: 'width 1s ease-out'
              }}></div>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Has recuperado el <span style={{ color: 'var(--success)', fontWeight: 700 }}>{((metrics.totalRecovery / (metrics.totalInvestment || 1)) * 100).toFixed(1)}%</span> de la inversión inicial en mercadería.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>Eficiencia</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(metrics.totalRecovery / (metrics.totalInvestment || 1)).toFixed(2)}x</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ratio retorno/inversión</div>
            </div>
            <div style={{ background: 'rgba(37, 99, 235, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Crecimiento</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>+{((metrics.revenueMonth / (metrics.totalRecovery || 1)) * 100).toFixed(1)}%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Este mes vs histórico</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Actividad Reciente */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--brand-primary)" /> Actividad Reciente (Ventas)
            </h3>
            <button 
              onClick={() => navigate('/dashboard/sales')}
              style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
            >
              Ir a POS <ArrowRight size={14} />
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            {recentSales.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Aún no hay ventas registradas.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentSales.map(sale => (
                  <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-4">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                        <ShoppingCart size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>Venta #{String(sale.id).padStart(5, '0')}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.location.name}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(sale.total)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{sale.paymentMethod}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: metrics.lowStockCount > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              <AlertTriangle size={20} /> Alertas de Stock
            </h3>
            {metrics.lowStockCount > 0 && (
              <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                {metrics.lowStockCount} alertas
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {lowStockAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <CheckCircle2 size={32} color="var(--success)" opacity={0.5} />
                <span>Todo el inventario está en niveles óptimos.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {lowStockAlerts.map(alert => (
                  <div key={alert.id} style={{ padding: '0.8rem', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--warning)', borderRadius: '0 8px 8px 0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{alert.name}</div>
                    <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>SKU: {alert.sku}</span>
                      <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{alert.currentStock} / {alert.minStock} min</span>
                    </div>
                  </div>
                ))}
                {metrics.lowStockCount > 5 && (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--brand-primary)', marginTop: '0.5rem', cursor: 'pointer' }} onClick={() => navigate('/dashboard/products')}>
                    Ver {metrics.lowStockCount - 5} alertas más...
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}
            onClick={() => navigate('/dashboard/purchases')}
          >
            <Truck size={16} /> Crear Orden de Compra
          </button>
        </div>

      </div>
    </div>
  );
};

// Componente para las tarjetas de métricas
const MetricCard = ({ title, value, subtitle, icon, color }) => (
  <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
    <div className="flex justify-between items-start mb-4">
      <div style={{ padding: '0.75rem', borderRadius: '12px', background: color }}>
        {icon}
      </div>
    </div>
    <div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</div>
    </div>
  </div>
);

// Import necesario
import { CheckCircle2 } from 'lucide-react';

export default DashboardHome;
