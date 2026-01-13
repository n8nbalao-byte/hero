import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Users, ShoppingBag, Store, TrendingUp, Activity, 
  MapPin, DollarSign, Package, AlertCircle, Settings, Save,
  X, Truck, User, Calendar, Clock, FileText, ChevronRight, Search, Bell, Lock
} from 'lucide-react';
import { translateStatus } from '../utils/translate';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Dados Gerais
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Listas Completas
  const [stores, setStores] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Modais / Detalhes Selecionados
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Configurações
  const [settings, setSettings] = useState({
    company_name: '', company_phone: '', company_whatsapp: '',
    company_cnpj: '', company_email: '',
    company_address: '', company_lat: '', company_lon: '',
    central_address: '', central_lat: '', central_lon: '',
    daily_machine_password: '',
    asaas_api_key: '', asaas_wallet_id: '', asaas_sandbox: false
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // Polling 10s
    return () => clearInterval(interval);
  }, []);

  // --- CARREGAMENTO POR TAB ---
  useEffect(() => {
    if (activeTab === 'stores') loadStores();
    if (activeTab === 'couriers') loadCouriers();
    if (activeTab === 'clients') loadClients();
    if (activeTab === 'settings' || activeTab === 'payments') loadSettings();
  }, [activeTab]);

  // --- FUNÇÕES DE API ---
  async function loadDashboardData() {
    try {
      setError(null);
      const [resStats, resLogs] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/logs')
      ]);
      setStats(resStats.data.stats);
      setLogs(resLogs.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setError('Falha ao conectar com o servidor. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  }

  async function loadStores() {
    try {
      const res = await api.get('/admin/stores');
      setStores(res.data);
    } catch (error) { console.error("Erro lojas", error); }
  }

  async function loadStoreDetails(id) {
    try {
      const res = await api.get(`/admin/stores/${id}`);
      setSelectedStore(res.data);
    } catch (error) { console.error("Erro detalhes loja", error); }
  }

  async function loadCouriers() {
    try {
      const res = await api.get('/admin/couriers');
      setCouriers(res.data);
    } catch (error) { console.error("Erro entregadores", error); }
  }

  async function loadCourierDetails(id) {
    try {
      const res = await api.get(`/admin/couriers/${id}`);
      setSelectedCourier(res.data);
    } catch (error) { console.error("Erro detalhes entregador", error); }
  }

  async function loadClients() {
    try {
      const res = await api.get('/admin/clients');
      setClients(res.data);
    } catch (error) { console.error("Erro clientes", error); }
  }

  async function loadClientDetails(id) {
    try {
      const res = await api.get(`/admin/clients/${id}`);
      setSelectedClient(res.data);
    } catch (error) { console.error("Erro detalhes cliente", error); }
  }

  async function loadSettings() {
    try {
      const response = await api.get('/settings');
      if (response.data) setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) { console.error("Erro settings", error); }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/settings', settings);
      alert('Configurações salvas!');
    } catch (error) {
      alert('Erro ao salvar.');
    } finally {
      setSavingSettings(false);
    }
  }

  const handleGenerateMachinePassword = async () => {
    const newPassword = Math.floor(1000 + Math.random() * 9000).toString();
    const newSettings = { ...settings, daily_machine_password: newPassword };
    setSettings(newSettings);
    
    // Salvar imediatamente
    try {
        await api.put('/settings', newSettings);
        alert(`Nova senha gerada: ${newPassword}`);
    } catch (e) {
        alert('Erro ao salvar nova senha.');
    }
  };

  const handleGPS = (prefix) => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      setSettings(prev => ({
        ...prev,
        [`${prefix}_lat`]: latitude,
        [`${prefix}_lon`]: longitude
      }));

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data && data.display_name) {
          setSettings(prev => ({
            ...prev,
            [`${prefix}_address`]: data.display_name
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

  const handleAddressSearch = async (prefix) => {
    const address = settings[`${prefix}_address`];
    if (!address || address.length < 3) {
      alert("Digite pelo menos 3 caracteres para buscar.");
      return;
    }
    setSearchingAddress(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            const first = data[0];
            setSettings(prev => ({
              ...prev,
              [`${prefix}_address`]: first.display_name,
              [`${prefix}_lat`]: first.lat,
              [`${prefix}_lon`]: first.lon
            }));
        } else {
            alert("Endereço não encontrado.");
        }
    } catch (error) {
        console.error("Search error", error);
        alert("Erro ao buscar endereço.");
    } finally {
        setSearchingAddress(false);
    }
  };

  const handleSettingChange = (e) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- FORMATADORES ---
  const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const date = (d) => new Date(d).toLocaleDateString('pt-BR');
  const dateTime = (d) => new Date(d).toLocaleString('pt-BR');

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Carregando Painel Master...</div>;
  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-red-500">
      <AlertCircle size={48} />
      <p className="text-xl font-bold">{error}</p>
      <button onClick={loadDashboardData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tentar Novamente</button>
    </div>
  );
  if (!stats) return <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-red-500" /> Painel Master
            </h1>
            
            {/* Mobile Notification Button */}
            <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="md:hidden relative p-2 hover:bg-slate-800 rounded-full"
            >
                <Bell size={24} />
                {stats && (
                   <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                     {(stats.stores || 0) + (stats.users.courier || 0)}
                   </span>
                )}
            </button>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto w-full md:w-auto justify-center">
            {['dashboard', 'stores', 'couriers', 'clients', 'payments', 'settings'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors whitespace-nowrap capitalize ${activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {tab === 'dashboard' ? 'Visão Geral' : 
                 tab === 'stores' ? 'Lojas' : 
                 tab === 'couriers' ? 'Entregadores' : 
                 tab === 'clients' ? 'Clientes' : 
                 tab === 'payments' ? 'Pagamentos' : 'Configurações'}
              </button>
            ))}
          </div>

          {/* Desktop Notification Button */}
          <div className="hidden md:block relative">
             <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-slate-800 rounded-full">
                <Bell size={24} />
                {stats && (
                   <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                     {(stats.stores || 0) + (stats.users.courier || 0)}
                   </span>
                )}
             </button>
             
             {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-fade-in">
                   <div className="p-3 border-b bg-slate-50 font-bold text-sm flex justify-between items-center">
                       <span>Notificações</span>
                       <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                   </div>
                   <div className="max-h-60 overflow-y-auto">
                      <button onClick={() => { setActiveTab('couriers'); setShowNotifications(false); }} className="w-full text-left p-4 hover:bg-slate-50 border-b flex justify-between items-center group">
                         <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Truck size={18}/></div>
                            <div>
                                <p className="font-bold text-sm text-slate-700 group-hover:text-blue-600">Entregadores</p>
                                <p className="text-xs text-slate-500">Total cadastrados</p>
                            </div>
                         </div>
                         <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">{stats?.users?.courier || 0}</span>
                      </button>

                      <button onClick={() => { setActiveTab('stores'); setShowNotifications(false); }} className="w-full text-left p-4 hover:bg-slate-50 border-b flex justify-between items-center group">
                         <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full text-green-600"><Store size={18}/></div>
                            <div>
                                <p className="font-bold text-sm text-slate-700 group-hover:text-green-600">Lojas</p>
                                <p className="text-xs text-slate-500">Lojas ativas na plataforma</p>
                            </div>
                         </div>
                         <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">{stats?.stores || 0}</span>
                      </button>
                      
                      {/* Placeholder para novos pedidos se houver endpoint */}
                      <div className="p-3 text-center text-xs text-slate-400 italic">
                        Novos pedidos aparecem no Log de Operações
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
        
        {/* Mobile Dropdown (se aberto) */}
        {showNotifications && (
            <div className="md:hidden mt-4 bg-white rounded-lg shadow-xl border border-slate-200 text-slate-800 overflow-hidden">
                <div className="p-3 border-b bg-slate-50 font-bold text-sm flex justify-between items-center">
                    <span>Notificações</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
                <div>
                    <button onClick={() => { setActiveTab('couriers'); setShowNotifications(false); }} className="w-full text-left p-4 hover:bg-slate-50 border-b flex justify-between items-center">
                        <span className="font-bold text-sm">Entregadores</span>
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">{stats?.users?.courier || 0}</span>
                    </button>
                    <button onClick={() => { setActiveTab('stores'); setShowNotifications(false); }} className="w-full text-left p-4 hover:bg-slate-50 border-b flex justify-between items-center">
                        <span className="font-bold text-sm">Lojas</span>
                        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">{stats?.stores || 0}</span>
                    </button>
                </div>
            </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <>
            {/* OPERATIONAL CARD */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg border border-slate-700 text-white mb-6">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                     <h3 className="text-lg font-bold flex items-center gap-2"><Lock className="text-yellow-400"/> Central de Distribuição</h3>
                     <p className="text-slate-300 text-sm mt-1">Informe a senha abaixo para os motoboys retirarem as maquininhas na central.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                     <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold">Senha de Retirada</p>
                        <p className="text-3xl font-mono font-bold text-white tracking-widest">
                           {settings.daily_machine_password || '----'}
                        </p>
                     </div>
                     <button 
                        onClick={handleGenerateMachinePassword}
                        className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors text-sm"
                     >
                        Gerar Nova
                     </button>
                  </div>
               </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Lojas Ativas</p>
                    <h3 className="text-3xl font-bold mt-2 text-slate-800">{stats.stores}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Store size={24}/></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Entregadores</p>
                    <h3 className="text-3xl font-bold mt-2 text-slate-800">{stats.users.courier}</h3>
                  </div>
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Truck size={24}/></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Clientes</p>
                    <h3 className="text-3xl font-bold mt-2 text-slate-800">{stats.users.client}</h3>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users size={24}/></div>
                </div>
              </div>
            </div>

            {/* ACTIVITY LOG */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center"><FileText size={18} className="mr-2"/> Log de Operações</h3>
                <span className="text-xs text-slate-400">Últimas 50 movimentações</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">Nenhuma atividade registrada.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {logs.map((log, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                        <div className={`p-2 rounded-full mt-1 ${
                          log.type === 'pedido' ? 'bg-green-100 text-green-600' :
                          log.type === 'usuario' ? 'bg-blue-100 text-blue-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {log.type === 'pedido' ? <ShoppingBag size={16}/> :
                           log.type === 'usuario' ? <User size={16}/> : <Store size={16}/>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-800 font-medium">{log.message}</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock size={12}/> {dateTime(log.criado_em)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- LOJAS TAB --- */}
        {activeTab === 'stores' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b bg-slate-50">
              <h3 className="font-bold text-slate-700">Todas as Lojas ({stores.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3">Dono</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => (
                    <tr key={store.id} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4">#{store.id}</td>
                      <td className="px-6 py-4 font-medium">{store.nome}</td>
                      <td className="px-6 py-4">{store.categoria}</td>
                      <td className="px-6 py-4">{store.owner_name} <br/><span className="text-xs text-slate-400">{store.owner_email}</span></td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          store.status_loja === 'aberta' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {store.status_loja}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => loadStoreDetails(store.id)} className="text-blue-600 hover:underline">Ver Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ENTREGADORES TAB --- */}
        {activeTab === 'couriers' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b bg-slate-50">
              <h3 className="font-bold text-slate-700">Todos os Entregadores ({couriers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-6 py-3">Contato</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Veículo</th>
                    <th className="px-6 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {couriers.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4">#{c.id}</td>
                      <td className="px-6 py-4 font-medium">{c.nome}</td>
                      <td className="px-6 py-4">{c.email}<br/>{c.telefone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.is_online ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{c.veiculo_tipo || '-'} <br/> <span className="text-xs text-slate-400">{c.veiculo_placa}</span></td>
                      <td className="px-6 py-4">
                        <button onClick={() => loadCourierDetails(c.id)} className="text-blue-600 hover:underline">Ver Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- CLIENTES TAB --- */}
        {activeTab === 'clients' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b bg-slate-50">
              <h3 className="font-bold text-slate-700">Clientes Cadastrados ({clients.length})</h3>
              <p className="text-xs text-slate-400">Exibindo do mais recente para o mais antigo</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Telefone</th>
                    <th className="px-6 py-3">Cadastrado em</th>
                    <th className="px-6 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4">#{client.id}</td>
                      <td className="px-6 py-4 font-medium">{client.nome}</td>
                      <td className="px-6 py-4">{client.email}</td>
                      <td className="px-6 py-4">{client.telefone}</td>
                      <td className="px-6 py-4">{date(client.criado_em)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => loadClientDetails(client.id)} className="text-blue-600 hover:underline">Ver Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PAYMENTS TAB --- */}
        {activeTab === 'payments' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign className="text-green-600" /> Configuração de Pagamentos
                </h2>
                <p className="text-sm text-slate-500 mt-1">Gerencie a integração com gateways de pagamento (Asaas)</p>
              </div>
              
              <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 border-b pb-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">A</div> Asaas Integração
                  </h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="mb-2"><strong>Instruções:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Crie uma conta no <a href="https://www.asaas.com" target="_blank" rel="noreferrer" className="underline font-bold">Asaas</a>.</li>
                        <li>Vá em <strong>Minha Conta {'>'} Integrações</strong> para gerar sua Chave API.</li>
                        <li>Use o ambiente de <strong>Sandbox</strong> para testes antes de ir para produção.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Chave API (API Key)</label>
                    <input 
                        type="text" 
                        name="asaas_api_key" 
                        value={settings.asaas_api_key || ''} 
                        onChange={handleSettingChange} 
                        className="w-full p-3 border border-slate-300 rounded-lg outline-none font-mono text-sm"
                        placeholder="$aact_..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ID da Carteira (Wallet ID)</label>
                    <input 
                        type="text" 
                        name="asaas_wallet_id" 
                        value={settings.asaas_wallet_id || ''} 
                        onChange={handleSettingChange} 
                        className="w-full p-3 border border-slate-300 rounded-lg outline-none font-mono text-sm"
                        placeholder="Opcional se usar a conta principal"
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <input 
                        type="checkbox" 
                        id="asaas_sandbox"
                        name="asaas_sandbox" 
                        checked={settings.asaas_sandbox === 'true' || settings.asaas_sandbox === true} 
                        onChange={(e) => setSettings({...settings, asaas_sandbox: e.target.checked})} 
                        className="w-5 h-5 text-blue-600 rounded"
                    />
                    <label htmlFor="asaas_sandbox" className="text-sm font-medium text-slate-700">Ativar Modo Sandbox (Ambiente de Testes)</label>
                  </div>

                  <h3 className="font-bold text-slate-700 border-b pb-2 flex items-center gap-2 mt-6">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">%</div> Descontos e Taxas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Desconto Pix (%)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                name="pix_discount" 
                                value={settings.pix_discount || ''} 
                                onChange={handleSettingChange} 
                                className="w-full p-3 border border-slate-300 rounded-lg outline-none font-mono text-sm pl-10"
                                placeholder="0"
                            />
                            <span className="absolute left-3 top-3 text-slate-400 font-bold">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Desconto aplicado sobre o valor dos produtos.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={savingSettings} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50">
                    <Save size={20} />
                    {savingSettings ? 'Salvando...' : 'Salvar Configurações de Pagamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="text-slate-500" /> Configurações Gerais
                </h2>
                <p className="text-sm text-slate-500 mt-1">Defina os dados da empresa e locais de retirada</p>
              </div>
              
              <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 border-b pb-2">Dados da Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                      <input type="text" name="company_name" value={settings.company_name} onChange={handleSettingChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / Suporte</label>
                      <input type="text" name="company_phone" value={settings.company_phone} onChange={handleSettingChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Oficial</label>
                    <input type="text" name="company_whatsapp" value={settings.company_whatsapp} onChange={handleSettingChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none"/>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-700 border-b pb-2">Central de Distribuição</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex gap-2 items-start">
                    <AlertCircle className="shrink-0 mt-0.5" size={16} />
                    <p>
                      A Central de Distribuição é o ponto de apoio logístico. <strong>A cada entrega</strong> que necessite de maquininha de cartão, este endereço será adicionado à rota para que o motoboy retire e devolva o equipamento.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                    <input type="text" name="central_address" value={settings.central_address} onChange={handleSettingChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                      <input type="text" name="central_lat" value={settings.central_lat} onChange={handleSettingChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                      <input type="text" name="central_lon" value={settings.central_lon} onChange={handleSettingChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none"/>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={savingSettings} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50">
                    <Save size={20} />
                    {savingSettings ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAIS --- */}
      
      {/* Modal Detalhes Loja */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Store className="text-blue-600"/> {selectedStore.store.nome}
              </h2>
              <button onClick={() => setSelectedStore(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Dados da Loja</h4>
                  <p><strong>Categoria:</strong> {selectedStore.store.categoria}</p>
                  <p><strong>Status:</strong> {selectedStore.store.status_loja}</p>
                  <p><strong>Endereço:</strong> {selectedStore.store.endereco}</p>
                  <p><strong>Telefone:</strong> {selectedStore.store.telefone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Imagens</h4>
                  <div className="flex gap-4">
                    <img src={selectedStore.store.imagem_url || 'https://via.placeholder.com/100'} alt="Logo" className="w-20 h-20 object-cover rounded border"/>
                    <img src={selectedStore.store.banner_url || 'https://via.placeholder.com/200x100'} alt="Banner" className="w-40 h-20 object-cover rounded border"/>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Produtos Cadastrados ({selectedStore.products.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedStore.products.map(prod => (
                    <div key={prod.id} className="border rounded-lg p-3 flex gap-3">
                      <img src={prod.imagem_url} alt={prod.nome} className="w-16 h-16 object-cover rounded"/>
                      <div>
                        <p className="font-bold text-sm line-clamp-2">{prod.nome}</p>
                        <p className="text-green-600 font-bold">{money(prod.preco)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Entregador */}
      {selectedCourier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck className="text-yellow-600"/> Detalhes do Entregador
              </h2>
              <button onClick={() => setSelectedCourier(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                {selectedCourier.avatar_url ? (
                  <img src={selectedCourier.avatar_url} alt={selectedCourier.nome} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"/>
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                    <User size={40} className="text-slate-400"/>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedCourier.nome}</h3>
                  <p className="text-slate-500">{selectedCourier.email}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${selectedCourier.online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {selectedCourier.online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">Total de Entregas</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCourier.total_entregas}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">Cadastro</p>
                  <p className="text-lg font-bold text-slate-700">{date(selectedCourier.criado_em)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Dados do Veículo</h4>
                <div className="flex justify-between bg-slate-50 p-3 rounded">
                  <span>Tipo: <strong>{selectedCourier.veiculo_tipo || 'Não informado'}</strong></span>
                  <span>Placa: <strong>{selectedCourier.veiculo_placa || '---'}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-purple-600"/> Detalhes do Cliente
              </h2>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{selectedClient.client.nome}</h3>
                  <p className="text-slate-500">{selectedClient.client.email}</p>
                  <p className="text-slate-500">{selectedClient.client.telefone}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-500">Cadastrado em</p>
                   <p className="font-bold">{date(selectedClient.client.criado_em)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3 border-b pb-2">Últimos Pedidos</h4>
                {selectedClient.recent_orders.length === 0 ? (
                  <p className="text-slate-400 italic">Nenhum pedido realizado.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedClient.recent_orders.map(ord => (
                      <div key={ord.id} className="flex justify-between items-center bg-slate-50 p-3 rounded">
                        <div>
                          <span className="font-bold">#{ord.id}</span> 
                          <span className="mx-2 text-slate-400">•</span>
                          {date(ord.criado_em)}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-green-700">{money(ord.valor_total)}</span>
                          <span className="text-xs bg-white border px-2 py-1 rounded">{translateStatus(ord.status)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}