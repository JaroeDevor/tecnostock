import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, PackageCheck, Clock, CheckCircle2, ChevronRight, Truck, Eye, Calendar, User, MapPin, FileText, X } from 'lucide-react';
import PurchaseForm from '../components/ui/PurchaseForm';

const Purchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null); // Orden a editar
  const [receivingOrder, setReceivingOrder] = useState(null); // Orden que se está recibiendo
  const [receivingId, setReceivingId] = useState(null); // ID de la orden procesándose
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null); // Orden para ver detalles completada
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data } = await api.get('/locations');
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (receiveData) => {
    setReceivingId(receivingOrder.id);
    try {
      await api.post(`/purchases/${receivingOrder.id}/receive`, receiveData);
      setReceivingOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al recibir mercadería');
    } finally {
      setReceivingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden de compra?')) {
      try {
        await api.delete(`/purchases/${id}`);
        fetchOrders();
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar la orden');
      }
    }
  };

  const handleEdit = (order) => {
    setOrderToEdit(order);
    setIsFormOpen(true);
  };

  const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col h-full relative">
      {/* Modal de Recepción Detallada */}
      {receivingOrder && (
        <ReceiveModal 
          order={receivingOrder} 
          locations={locations}
          onClose={() => setReceivingOrder(null)} 
          onConfirm={handleReceive}
          loading={!!receivingId}
        />
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Órdenes de Compra</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setOrderToEdit(null); setIsFormOpen(true); }} style={{ padding: '0.8rem 1.5rem', boxShadow: 'var(--shadow-glow)' }}>
          <Plus size={20} /> Nueva Orden de Compra
        </button>
      </div>

      {/* Tarjetas de Resumen (Métricas) */}
      <div className="flex gap-6 mb-8">
        <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Clock size={32} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>En Tránsito (Draft)</p>
            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{orders.filter(o => o.status === 'DRAFT').length}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={32} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Recibidas (Últimos 30 días)</p>
            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{orders.filter(o => o.status === 'COMPLETE').length}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', flex: 1, padding: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando órdenes de compra...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                <Truck size={48} color="var(--text-muted)" opacity={0.5} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Aún no hay compras</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Genera tu primera Orden de Compra para abastecer el inventario físico del Almacén Central.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {orders.map((order) => (
                <div key={order.id} className="glass-panel" style={{ 
                  padding: '1.5rem', 
                  background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)',
                  border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                    <div style={{ textAlign: 'center', width: '80px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orden #</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{String(order.id).padStart(5, '0')}</div>
                    </div>
                    
                    <div style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                    
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{order.supplier?.name || 'Proveedor'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} productos diferentes
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatUSD(order.totalUsd)}</div>
                    </div>

                    <div style={{ width: '150px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ 
                        backgroundColor: order.status === 'COMPLETE' ? 'rgba(34, 197, 94, 0.1)' : order.status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                        color: order.status === 'COMPLETE' ? '#4ADE80' : order.status === 'PARTIAL' ? '#F59E0B' : '#60A5FA',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: `1px solid ${order.status === 'COMPLETE' ? 'rgba(34, 197, 94, 0.2)' : order.status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                      }}>
                        {order.status === 'COMPLETE' ? <CheckCircle2 size={16} /> : order.status === 'PARTIAL' ? <Clock size={16} /> : <Clock size={16} />}
                        {order.status === 'COMPLETE' ? 'Completada' : order.status === 'PARTIAL' ? 'Parcial' : 'En Tránsito'}
                      </div>
                    </div>

                    <div>
                      {order.status !== 'COMPLETE' ? (
                        <div className="flex gap-2">
                          {order.status === 'DRAFT' && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleEdit(order)}
                                title="Editar Orden"
                                style={{ padding: '0.6rem', borderRadius: '12px' }}
                              >
                                <FileText size={18} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleDelete(order.id)}
                                title="Eliminar Orden"
                                style={{ padding: '0.6rem', borderRadius: '12px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                          <button 
                            className="btn btn-primary" 
                            onClick={() => setReceivingOrder(order)} 
                            disabled={receivingId === order.id}
                            style={{ padding: '0.6rem 1.2rem', gap: '0.5rem', borderRadius: '12px', marginLeft: '0.5rem' }}
                          >
                            <PackageCheck size={18} /> {order.status === 'PARTIAL' ? 'Completar' : 'Ingresar'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Recibido por: <span style={{ color: 'var(--text-primary)' }}>{order.receivedBy}</span><br/>
                            El: {new Date(order.receivedAt).toLocaleDateString()}
                          </div>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.6rem', borderRadius: '12px' }}
                            onClick={() => setSelectedOrderForDetails(order)}
                            title="Ver Comprobante de Recepción"
                          >
                            <Eye size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <PurchaseForm 
          onClose={() => { setIsFormOpen(false); setOrderToEdit(null); }} 
          onSave={() => { setIsFormOpen(false); setOrderToEdit(null); fetchOrders(); }} 
          initialData={orderToEdit}
        />
      )}

      {selectedOrderForDetails && (
        <OrderDetailsModal 
          order={selectedOrderForDetails} 
          onClose={() => setSelectedOrderForDetails(null)} 
        />
      )}
    </div>
  );
};

// Componente Interno para el Modal de Recepción
const ReceiveModal = ({ order, locations, onClose, onConfirm, loading }) => {
  const { user } = useContext(AuthContext);
  
  // Estado para la cantidad a recibir de cada ítem
  const [receiveQuantities, setReceiveQuantities] = useState(() => {
    const initial = {};
    order.items.forEach(item => {
      const pending = item.qtyOrdered - item.qtyReceived;
      initial[item.id] = pending > 0 ? pending : 0;
    });
    return initial;
  });

  const [data, setData] = useState({
    locationId: locations[0]?.id || '',
    receivedBy: user?.name || '',
    arrivalDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleQtyChange = (itemId, val, max) => {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > max) num = max;
    setReceiveQuantities(prev => ({ ...prev, [itemId]: num }));
  };

  const handleSubmit = () => {
    const itemsPayload = Object.entries(receiveQuantities)
      .map(([itemId, qty]) => ({ itemId: Number(itemId), qtyToReceive: qty }))
      .filter(i => i.qtyToReceive > 0);

    if (itemsPayload.length === 0) {
      alert("Debe ingresar al menos un producto para recibir.");
      return;
    }

    onConfirm({ ...data, items: itemsPayload });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', animation: 'scaleUp 0.3s ease-out' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <PackageCheck size={28} color="var(--brand-primary)" />
          Recepción de Mercadería
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Ingresando ítems de la <b>Orden #{String(order.id).padStart(5, '0')}</b> al inventario físico.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Ítems de la Orden</h4>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Producto</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Pedida</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Recibida</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Pendiente</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', width: '120px' }}>A Recibir</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => {
                  const pending = item.qtyOrdered - item.qtyReceived;
                  const isComplete = pending <= 0;
                  return (
                    <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)', opacity: isComplete ? 0.5 : 1 }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{item.product?.name || `Ítem ID: ${item.productId}`}</td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>{item.qtyOrdered}</td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--success)' }}>{item.qtyReceived}</td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>{pending}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <input 
                          type="number" 
                          min="0" 
                          max={pending}
                          value={receiveQuantities[item.id]} 
                          onChange={(e) => handleQtyChange(item.id, e.target.value, pending)}
                          disabled={isComplete}
                          style={{ padding: '0.4rem', textAlign: 'center' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label>Depósito de Destino *</label>
              <select 
                value={data.locationId} 
                onChange={e => setData({...data, locationId: e.target.value})}
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Fecha de Llegada *</label>
              <input 
                required type="date" 
                value={data.arrivalDate} 
                onChange={e => setData({...data, arrivalDate: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label>Responsable de Recepción *</label>
            <input 
              required type="text" 
              value={data.receivedBy} 
              onChange={e => setData({...data, receivedBy: e.target.value})} 
              placeholder="Nombre del empleado"
            />
          </div>

          <div>
            <label>Observaciones (Opcional)</label>
            <input 
              type="text" 
              value={data.notes} 
              onChange={e => setData({...data, notes: e.target.value})}
              placeholder="Ej: Entrega parcial por falta de stock del proveedor"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancelar</button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 2, padding: '0.8rem' }} 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Ingreso'}
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

// Componente Interno para ver detalles de una orden completada
const OrderDetailsModal = ({ order, onClose }) => {
  const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', animation: 'scaleUp 0.3s ease-out', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Comprobante de Recepción</div>
            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>Orden #{String(order.id).padStart(5, '0')}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <CheckCircle2 size={18} /> MERCADERÍA INGRESADA
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Proveedor: {order.supplier?.name}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
              <User size={12} /> Responsable
            </div>
            <div style={{ fontWeight: 600 }}>{order.receivedBy}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
              <Calendar size={12} /> Fecha de Llegada
            </div>
            <div style={{ fontWeight: 600 }}>{new Date(order.receivedAt).toLocaleDateString()}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
              <MapPin size={12} /> Depósito Destino
            </div>
            <div style={{ fontWeight: 600 }}>{order.location?.name || 'Desconocido'}</div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} /> Productos Recibidos
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Producto</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0' }}>Cant.</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>Costo Unit.</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 0' }}>{item.product?.name}</td>
                  <td style={{ textAlign: 'center', padding: '0.75rem 0' }}>{item.qtyOrdered}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>{formatUSD(item.unitCostUsd)}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: 600 }}>{formatUSD(item.qtyOrdered * item.unitCostUsd)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', padding: '1.5rem 0 0 0', color: 'var(--text-muted)' }}>Inversión Total:</td>
                <td style={{ textAlign: 'right', padding: '1.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{formatUSD(order.totalUsd)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.notes && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>OBSERVACIONES DE RECEPCIÓN</div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>{order.notes}</div>
          </div>
        )}

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-secondary" style={{ padding: '0.8rem 2.5rem' }} onClick={onClose}>Cerrar Comprobante</button>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
