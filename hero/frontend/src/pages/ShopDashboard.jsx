import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  Store, Package, ShoppingBag, Settings, Database, MapPin
} from 'lucide-react';

// Importando os componentes separados
import DashboardTab from './shop-dashboard/DashboardTab';
import ProductsTab from './shop-dashboard/ProductsTab';
import OrdersTab from './shop-dashboard/OrdersTab';
import ImportTab from './shop-dashboard/ImportTab';
import SettingsTab from './shop-dashboard/SettingsTab';

export default function ShopDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, pending: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(null);
  const [createStoreForm, setCreateStoreForm] = useState({
    name: '',
    whatsappPedidos: '',
    category: '',
    address: '', // Campo legado, vamos tentar preencher com logradouro
    description: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
    latitude: '', longitude: ''
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const previousOrderIdsRef = React.useRef(new Set());
  
  const notificationIntervalRef = React.useRef(null);
  
  // Função de fala (TTS)
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Cancela falas anteriores para não empilhar
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  };

  // GPS
  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Update coords immediately
      setCreateStoreForm(prev => ({ ...prev, latitude, longitude }));

      try {
        // Reverse geocoding with Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data && data.address) {
          const addr = data.address;
          setCreateStoreForm(prev => ({
            ...prev,
            latitude, longitude,
            cep: addr.postcode || prev.cep,
            logradouro: addr.road || prev.logradouro,
            numero: addr.house_number || prev.numero,
            bairro: addr.suburb || addr.neighbourhood || prev.bairro,
            cidade: addr.city || addr.town || addr.municipality || prev.cidade,
            uf: 'SP', // Default SP
            address: `${addr.road || ''}, ${addr.house_number || ''} - ${addr.suburb || ''}, ${addr.city || ''} - SP`
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar endereço:", error);
        alert("Localização obtida, mas não foi possível preencher o endereço automaticamente.");
      } finally {
        setLoadingLocation(false);
      }
    }, (error) => {
      console.error("Erro GPS:", error);
      alert("Erro ao obter localização. Verifique as permissões.");
      setLoadingLocation(false);
    });
  };

  // Gerencia notificação persistente
  useEffect(() => {
    const hasPending = orders.some(o => o.status === 'pending');
    
    if (hasPending) {
      // Se tem pendente e não tem intervalo rodando, inicia
      if (!notificationIntervalRef.current) {
        speak('Atenção! Você tem novos pedidos aguardando aceitação.');
        notificationIntervalRef.current = setInterval(() => {
          speak('Atenção! Você tem novos pedidos aguardando aceitação.');
        }, 15000); // Repete a cada 15 segundos
      }
    } else {
      // Se não tem pendente, limpa intervalo
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
        window.speechSynthesis.cancel(); // Para de falar imediatamente
      }
    }

    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, [orders]);

  // Processar novos pedidos para notificação (apenas visual ou log se necessário, pois o useEffect acima cuida do som persistente)
  const checkNewOrders = (currentOrders) => {
     // A lógica de som foi movida para o useEffect persistente
     // Mantemos a ref apenas para saber o que mudou se quisermos exibir um toast no futuro
    const newIds = new Set(currentOrders.map(o => o.id));
    previousOrderIdsRef.current = newIds;
  };

  // --- CARREGAMENTO DE DADOS ---
  const loadData = useCallback(async (storeId) => {
    if (!storeId) return;
    try {
      // Adicionado mode=seller para garantir que retornamos pedidos da loja, não do usuário cliente
      const [ordRes, prodRes] = await Promise.all([
        api.get('/orders?mode=seller'), 
        api.get(`/stores/${storeId}/products`)
      ]);
      const currentOrders = ordRes.data || [];
      
      setProducts(prodRes.data || []);
      setOrders(currentOrders);
      
      // Checar notificações apenas se não for o primeiro load absoluto (mas aqui o loading pode já ser false em refreshs manuais)
      checkNewOrders(currentOrders);

      const revenue = currentOrders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + Number(o.valor_total), 0);
      setStats({ 
        revenue, 
        pending: currentOrders.filter(o => ['pending', 'accepted', 'ready_for_pickup', 'delivering'].includes(o.status)).length, 
        totalProducts: (prodRes.data || []).length 
      });
    } catch (e) { console.error("Erro dados", e); }
  }, []); // Remove checkNewOrders from dependency to avoid loop if it was there, but it's defined inside component

  const loadStore = useCallback(async () => {
    // setLoading(true); // Removido para não piscar a tela no refresh manual, mas cuidado com estado inicial
    try {
      const { data } = await api.get('/my-store');
      if (!data || !data.id) { setHasStore(false); setLoading(false); return; }
      setStore(data); 
      setHasStore(true);
      
      // Primeira carga popula o Ref sem notificar
      const ordRes = await api.get('/orders');
      const initialOrders = ordRes.data || [];
      previousOrderIdsRef.current = new Set(initialOrders.map(o => o.id));
      setOrders(initialOrders);

      // Carrega resto
      await loadData(data.id);
      
    } catch (e) { if (e.response?.status === 404) setHasStore(false); } finally { setLoading(false); }
  }, [loadData]);


  useEffect(() => { loadStore(); }, [loadStore]);

  // --- POLLING AUTOMÁTICO (ATUALIZAÇÃO EM TEMPO REAL) ---
  useEffect(() => {
    if (!store?.id) return;
    
    const interval = setInterval(() => {
        // Atualiza silenciosamente sem loading
        api.get('/orders').then(res => {
            const currentOrders = res.data || [];
            setOrders(currentOrders);
            checkNewOrders(currentOrders); // Verifica se tem novos para notificar

            // Recalcula stats
            const revenue = currentOrders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + Number(o.valor_total), 0);
            const pending = currentOrders.filter(o => ['pending', 'accepted'].includes(o.status)).length;
            
            // Só atualiza stats se mudou (para evitar re-renders desnecessários se possível, mas React cuida disso)
            setStats(prev => ({ ...prev, revenue, pending }));
        }).catch(e => console.error("Polling error", e));
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [store?.id]);

  // --- CRIAR LOJA (PRIMEIRO ACESSO) ---
  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      // Mapeia whatsappPedidos para phone, pois o backend espera phone
      const payload = {
        ...createStoreForm,
        phone: createStoreForm.whatsappPedidos
      };
      await api.post('/stores', payload);
      alert('✅ Loja criada com sucesso! Bem-vindo.');
      loadStore();
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.error || 'Erro desconhecido.';
      alert('❌ Erro ao criar loja: ' + errorMessage);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-medium">Carregando painel...</div>;
  
  // TELA DE CRIAÇÃO SIMPLIFICADA (PRIMEIRO ACESSO)
  if (hasStore === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Campinas Delivery!</h1>
            <p className="text-gray-500 mt-2">Vamos configurar sua loja em poucos passos para você começar a vender.</p>
          </div>

          <form onSubmit={handleCreateStore} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Loja (App)</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="Ex: Lanchonete do João"
                  value={createStoreForm.name} 
                  onChange={e => setCreateStoreForm({...createStoreForm, name: e.target.value})} 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Telefone (WhatsApp)</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="(19) 99999-9999"
                  value={createStoreForm.whatsappPedidos} 
                  onChange={e => setCreateStoreForm({...createStoreForm, whatsappPedidos: e.target.value})} 
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Categoria Principal</label>
                <select 
                  className="w-full border p-3 rounded-lg bg-white focus:ring-2 focus:ring-red-500 outline-none"
                  value={createStoreForm.category}
                  onChange={e => setCreateStoreForm({...createStoreForm, category: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Eletronicos">Eletrônicos / Informática</option>
                  <option value="Roupas">Roupas e Moda</option>
                  <option value="Acessorios">Acessórios e Joias</option>
                  <option value="Casa">Casa e Decoração</option>
                  <option value="Beleza">Beleza e Perfumaria</option>
                  <option value="Esportes">Esportes e Lazer</option>
                  <option value="Livros">Livros e Papelaria</option>
                  <option value="Brinquedos">Brinquedos e Games</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="col-span-2">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Endereço da Loja</label>
                    <button type="button" onClick={handleGPS} disabled={loadingLocation} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-blue-100 transition flex items-center">
                        <MapPin size={12} className="mr-1"/> {loadingLocation ? 'Buscando...' : 'Preencher com GPS'}
                    </button>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                        <input className="w-full border p-3 rounded-lg text-sm" placeholder="CEP" value={createStoreForm.cep} onChange={e => setCreateStoreForm({...createStoreForm, cep: e.target.value})} />
                    </div>
                    <div className="col-span-3">
                         <input className="w-full border p-3 rounded-lg text-sm" placeholder="Rua / Logradouro" value={createStoreForm.logradouro} onChange={e => setCreateStoreForm({...createStoreForm, logradouro: e.target.value})} required />
                    </div>
                    <div className="col-span-1">
                         <input className="w-full border p-3 rounded-lg text-sm" placeholder="Número" value={createStoreForm.numero} onChange={e => setCreateStoreForm({...createStoreForm, numero: e.target.value})} required />
                    </div>
                    <div className="col-span-2">
                         <input className="w-full border p-3 rounded-lg text-sm" placeholder="Bairro" value={createStoreForm.bairro} onChange={e => setCreateStoreForm({...createStoreForm, bairro: e.target.value})} required />
                    </div>
                    <div className="col-span-1">
                         <input className="w-full border p-3 rounded-lg text-sm" placeholder="Cidade" value={createStoreForm.cidade} onChange={e => setCreateStoreForm({...createStoreForm, cidade: e.target.value})} required />
                    </div>
                </div>
                {createStoreForm.latitude && <p className="text-xs text-green-600 mt-1 flex items-center"><MapPin size={10} className="mr-1"/> Localização GPS vinculada</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição Curta (Bio)</label>
                <textarea 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none" 
                  rows={2}
                  placeholder="O melhor lanche da cidade..."
                  value={createStoreForm.description} 
                  onChange={e => setCreateStoreForm({...createStoreForm, description: e.target.value})} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition shadow-lg transform active:scale-95"
            >
              Criar Minha Loja Agora
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Se chegou aqui e não tem store, houve algum erro no carregamento
  if (!store) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-gray-500 gap-4">
        <p>Não foi possível carregar os dados da loja.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white rounded-md">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col z-20 h-full shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            {store.imagem_url ? <img src={store.imagem_url} className="w-10 h-10 rounded-full object-cover border"/> : <div className="w-10 h-10 bg-gray-200 rounded-full"/>}
            <div className="overflow-hidden"><h1 className="font-bold text-sm truncate">{store?.nome}</h1><p className="text-xs text-gray-400">Painel Lojista</p></div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[{id:'dashboard',icon:Store,l:'Visão Geral'},{id:'products',icon:Package,l:'Catálogo'},{id:'orders',icon:ShoppingBag,l:'Pedidos'},{id:'import',icon:Database,l:'Importação'},{id:'settings',icon:Settings,l:'Configurações'}].map(i=>(
            <button key={i.id} onClick={()=>setActiveTab(i.id)} className={`flex items-center w-full p-3 rounded-md text-sm font-medium transition ${activeTab===i.id?'bg-gray-100 text-gray-900':'text-gray-500 hover:bg-gray-50'}`}><i.icon size={18} className="mr-3"/> {i.l}</button>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        
        {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
        {activeTab === 'products' && <ProductsTab store={store} products={products} onRefresh={() => loadData(store.id)} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} onRefresh={() => loadData(store.id)} />}
        {activeTab === 'import' && <ImportTab store={store} onRefresh={() => loadData(store.id)} />}
        {activeTab === 'settings' && <SettingsTab store={store} onRefresh={loadStore} />}

      </main>
    </div>
  );
}
