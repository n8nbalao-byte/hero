import React, { useEffect, useRef, useState } from 'react';

const styles = {
  mapContainer: { width: '100%', height: '300px', marginTop: '15px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' },
  etaBox: { marginTop: '10px', padding: '10px', backgroundColor: '#eef2ff', borderRadius: '8px', color: '#4338ca', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }
};

export default function OrderTrackingMap({ order }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [etaMin, setEtaMin] = useState(15);
  const [status, setStatus] = useState('connecting'); // connecting, connected, error

  const formatEta = (minutes) => {
    if (!isFinite(minutes) || minutes <= 0) return 'Chegando!';
    return minutes < 60 ? `${Math.round(minutes)} min` : `${Math.floor(minutes/60)}h ${Math.round(minutes%60)}m`;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const orderId = order.id;
    let map = null;
    let eventSource = null;

    // 1. Inicializar Mapa
    if (window.L) {
        const elId = `map-${orderId}`;
        // Pequeno delay para garantir que o elemento DOM existe
        setTimeout(() => {
            if (!document.getElementById(elId)) return;
            
            map = window.L.map(elId).setView([order.store?.latitude || -22.9, order.store?.longitude || -47.0], 14);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Marcador da Loja
            if (order.store?.latitude) {
                window.L.marker([order.store.latitude, order.store.longitude])
                  .addTo(map)
                  .bindPopup(`🏬 ${order.store?.nome || 'Loja'}`)
                  .openPopup();
            }

            // Marcador do Cliente (se tiver coords, senão usa o do pedido se geocoded)
            // (Opcional, mas ajuda a visualizar o trajeto)
        }, 100);
    }

    // 2. Conectar SSE
    const connectSSE = () => {
        eventSource = new EventSource(`http://localhost:3000/orders/${orderId}/track?token=${token}`);
        
        eventSource.onopen = () => setStatus('connected');
        
        eventSource.onmessage = (ev) => {
            const data = JSON.parse(ev.data);
            const { latitude, longitude } = data;

            if (map) {
                if (!markerRef.current) {
                    const icon = window.L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    });
                    markerRef.current = window.L.marker([latitude, longitude], { icon }).addTo(map);
                } else {
                    markerRef.current.setLatLng([latitude, longitude]);
                }
                map.panTo([latitude, longitude]);
            }
            
            // Simula ETA (reduz 0.1 min a cada update)
            setEtaMin(prev => Math.max(0, prev - 0.1));
        };

        eventSource.onerror = () => {
            console.error("Erro no SSE");
            setStatus('error');
            eventSource.close();
        };
    };

    connectSSE();

    return () => {
        if (eventSource) eventSource.close();
        if (map) map.remove();
    };
  }, [order.id, order.store]);

  return (
    <div>
        {status === 'connecting' && <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>🛰️ Conectando ao satélite...</div>}
        {status === 'error' && <div style={{ padding: '10px', color: 'red', textAlign: 'center' }}>⚠️ Sinal perdido. Tentando reconectar...</div>}
        
        <div style={styles.etaBox}>🚀 Chega em aproximadamente: {formatEta(etaMin)}</div>
        <div id={`map-${order.id}`} style={styles.mapContainer}></div>
    </div>
  );
}
