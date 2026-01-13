import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Wallet, Palette, Bot, FileText, Clock } from 'lucide-react';
import api from '../../services/api';

const DEFAULT_HOURS = {
  seg: { active: true, start: '08:00', end: '18:00' },
  ter: { active: true, start: '08:00', end: '18:00' },
  qua: { active: true, start: '08:00', end: '18:00' },
  qui: { active: true, start: '08:00', end: '18:00' },
  sex: { active: true, start: '08:00', end: '18:00' },
  sab: { active: true, start: '08:00', end: '14:00' },
  dom: { active: false, start: '08:00', end: '12:00' },
};

const DAY_LABELS = { seg:'Segunda', ter:'Terça', qua:'Quarta', qui:'Quinta', sex:'Sexta', sab:'Sábado', dom:'Domingo' };

export default function SettingsTab({ store, onRefresh }) {
  const [settingsTab, setSettingsTab] = useState('company');
  const [storeForm, setStoreForm] = useState({
    name: '', description: '', category: '',
    razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '', responsavelLegal: '', cpfResponsavel: '',
    phone: '', telefoneLoja: '', whatsappPedidos: '', responsibleName: '', responsiblePhone: '', responsibleEmail: '', emailFinanceiro: '',
    address: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', latitude: '', longitude: '',
    bancoCodigo: '', bancoNome: '', agencia: '', conta: '', tipoConta: 'corrente', chavePixTipo: '', chavePixValor: '',
    imageUrl: '', bannerUrl: '', primaryColor: '#DC0000', secondaryColor: '#333333', themeName: 'custom',
    tempoPreparoMedio: 30, pedidoMinimo: 0, statusLoja: 'fechada',
    openaiKey: ''
  });
  const [openingHours, setOpeningHours] = useState(DEFAULT_HOURS);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Initialize form when store prop changes
  useEffect(() => {
    if (store) {
      setStoreForm({
        name: store.nome || store.name || '', description: store.descricao || store.description || '', category: store.categoria || store.category || '',
        razaoSocial: store.razao_social || '', nomeFantasia: store.nome_fantasia || '', cnpj: store.cnpj || '', 
        inscricaoEstadual: store.inscricao_estadual || '', responsavelLegal: store.responsavel_legal || '', cpfResponsavel: store.cpf_responsavel || '',
        phone: store.telefone || store.phone || '', telefoneLoja: store.telefone_loja || '', whatsappPedidos: store.whatsapp_pedidos || '',
        responsibleName: store.responsavel_nome || store.responsible_name || '', responsiblePhone: store.responsavel_telefone || store.responsible_phone || '', responsibleEmail: store.responsavel_email || store.responsible_email || '', emailFinanceiro: store.email_financeiro || '',
        address: store.endereco || store.address || '', cep: store.cep || '', logradouro: store.logradouro || '', numero: store.numero || '', complemento: store.complemento || '', bairro: store.bairro || '', cidade: store.cidade || '', uf: store.uf || '',
        latitude: store.latitude || '', longitude: store.longitude || '',
        bancoCodigo: store.banco_codigo || '', bancoNome: store.banco_nome || '', agencia: store.agencia || '', conta: store.conta || '', tipoConta: store.tipo_conta || 'corrente', chavePixTipo: store.chave_pix_tipo || '', chavePixValor: store.chave_pix_valor || '',
        imageUrl: store.imagem_url || store.imageUrl || '', bannerUrl: store.banner_url || '', primaryColor: store.cor_primaria || store.primary_color || '#DC0000', secondaryColor: store.cor_secundaria || store.secondary_color || '#333333', themeName: store.tema || store.theme_name || 'custom',
        tempoPreparoMedio: store.tempo_preparo_medio || 30, pedidoMinimo: store.pedido_minimo || 0, statusLoja: store.status_loja || 'fechada',
        openaiKey: store.openai_key || ''
      });

      const horarios = store.horarios_funcionamento || store.opening_hours;
      if (horarios) {
        try { 
          let parsed = typeof horarios === 'string' ? JSON.parse(horarios) : horarios;
          setOpeningHours({ ...DEFAULT_HOURS, ...parsed });
        } catch (e) { 
          setOpeningHours(DEFAULT_HOURS); 
        }
      }
    }
  }, [store]);

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Update coords immediately
      setStoreForm(prev => ({ ...prev, latitude, longitude }));

      try {
        // Reverse geocoding with Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data && data.address) {
          const addr = data.address;
          setStoreForm(prev => ({
            ...prev,
            latitude, longitude,
            cep: addr.postcode || prev.cep,
            logradouro: addr.road || prev.logradouro,
            numero: addr.house_number || prev.numero,
            bairro: addr.suburb || addr.neighbourhood || prev.bairro,
            cidade: addr.city || addr.town || addr.municipality || prev.cidade,
            uf: 'SP' // Campinas/SP default for now, can be improved
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

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...storeForm, openingHours: JSON.stringify(openingHours) };
      await api.put('/my-store', payload);
      alert('✅ Configurações salvas com sucesso!'); 
      onRefresh();
    } catch (error) { 
      console.error(error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || 'Erro desconhecido.';
      alert('❌ Erro ao salvar: ' + errorMessage); 
    }
  };

  const toggleDay = (day) => {
    setOpeningHours(prev => {
      const currentDay = prev[day] || DEFAULT_HOURS[day];
      return { ...prev, [day]: { ...currentDay, active: !currentDay.active } };
    });
  };

  const updateTime = (day, field, value) => {
    setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm max-w-4xl mx-auto flex flex-col h-[calc(100vh-100px)] animate-fade-in overflow-hidden">
      <div className="p-6 border-b bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">Configurações da Loja</h2>
        <div className="flex gap-1 mt-6 overflow-x-auto">
          {[
            { id: 'company', icon: Building2, label: 'Dados da Loja' },
            { id: 'address', icon: MapPin, label: 'Endereço' },
            { id: 'finance', icon: Wallet, label: 'Financeiro' },
            { id: 'visual', icon: Palette, label: 'Visual' },
            { id: 'ai', icon: Bot, label: 'Integrações' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 transition-all ${
                settingsTab === tab.id 
                ? 'bg-white border-black text-black shadow-sm' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} className="mr-2"/> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <form id="settings-form" onSubmit={handleUpdateStore} className="space-y-6">
          
          {/* 1. DADOS DA LOJA + HORÁRIOS + OPERACIONAL */}
          {settingsTab === 'company' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Identidade */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Fantasia (App)</label><input className="w-full border p-2 rounded" value={storeForm.name} onChange={e=>setStoreForm({...storeForm, name: e.target.value})} required/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razão Social</label><input className="w-full border p-2 rounded" value={storeForm.razaoSocial} onChange={e=>setStoreForm({...storeForm, razaoSocial: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">CNPJ</label><input className="w-full border p-2 rounded" value={storeForm.cnpj} onChange={e=>setStoreForm({...storeForm, cnpj: e.target.value})} placeholder="00.000.000/0001-00"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Insc. Estadual</label><input className="w-full border p-2 rounded" value={storeForm.inscricaoEstadual} onChange={e=>setStoreForm({...storeForm, inscricaoEstadual: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resp. Legal</label><input className="w-full border p-2 rounded" value={storeForm.responsavelLegal} onChange={e=>setStoreForm({...storeForm, responsavelLegal: e.target.value})} /></div>
                
                <div className="col-span-2 border-t pt-4 mt-2"><h4 className="font-bold text-gray-800 mb-4 flex items-center"><FileText size={16} className="mr-2"/> Contato Público</h4></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone Fixo</label><input className="w-full border p-2 rounded" value={storeForm.telefoneLoja} onChange={e=>setStoreForm({...storeForm, telefoneLoja: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Whatsapp Pedidos</label><input className="w-full border p-2 rounded" value={storeForm.whatsappPedidos} onChange={e=>setStoreForm({...storeForm, whatsappPedidos: e.target.value})} /></div>
              </div>

              {/* Operacional e Horários */}
              <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center"><Clock size={16} className="mr-2"/> Status e Horários</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Status da Loja:</label>
                        <select 
                            className={`border p-1 rounded text-sm font-bold ${storeForm.statusLoja === 'aberta' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}
                            value={storeForm.statusLoja}
                            onChange={e => setStoreForm({...storeForm, statusLoja: e.target.value})}
                        >
                            <option value="aberta">🟢 ABERTA</option>
                            <option value="fechada">🔴 FECHADA</option>
                        </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-lg border">
                      {Object.keys(DEFAULT_HOURS).map(day => (
                          <div key={day} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-200">
                              <div className="flex items-center gap-3 w-32">
                                  <input type="checkbox" checked={openingHours[day].active} onChange={()=>toggleDay(day)} className="w-4 h-4 text-red-600 rounded"/>
                                  <span className="capitalize text-sm font-medium">{DAY_LABELS[day]}</span>
                              </div>
                              <div className={`flex items-center gap-2 transition ${!openingHours[day].active ? 'opacity-30 grayscale' : ''}`}>
                                  <input type="time" value={openingHours[day].start} onChange={e=>updateTime(day, 'start', e.target.value)} disabled={!openingHours[day].active} className="border p-1 rounded text-sm"/>
                                  <span className="text-gray-400">-</span>
                                  <input type="time" value={openingHours[day].end} onChange={e=>updateTime(day, 'end', e.target.value)} disabled={!openingHours[day].active} className="border p-1 rounded text-sm"/>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
            </div>
          )}

          {/* 2. ENDEREÇO */}
          {settingsTab === 'address' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-end">
                    <button type="button" onClick={handleGPS} disabled={loadingLocation} className="flex items-center text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition">
                        <MapPin size={16} className="mr-2"/>
                        {loadingLocation ? 'Buscando...' : 'Preencher com GPS'}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">CEP</label><input className="w-full border p-2 rounded" value={storeForm.cep} onChange={e=>setStoreForm({...storeForm, cep: e.target.value})} /></div>
                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logradouro</label><input className="w-full border p-2 rounded" value={storeForm.logradouro} onChange={e=>setStoreForm({...storeForm, logradouro: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número</label><input className="w-full border p-2 rounded" value={storeForm.numero} onChange={e=>setStoreForm({...storeForm, numero: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Complemento</label><input className="w-full border p-2 rounded" value={storeForm.complemento} onChange={e=>setStoreForm({...storeForm, complemento: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bairro</label><input className="w-full border p-2 rounded" value={storeForm.bairro} onChange={e=>setStoreForm({...storeForm, bairro: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label><input className="w-full border p-2 rounded" value={storeForm.cidade} onChange={e=>setStoreForm({...storeForm, cidade: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">UF</label><input className="w-full border p-2 rounded" value={storeForm.uf} onChange={e=>setStoreForm({...storeForm, uf: e.target.value})} maxLength={2}/></div>
                    
                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Latitude</label><input className="w-full border p-2 rounded bg-gray-100 text-gray-500" value={storeForm.latitude} readOnly /></div>
                        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Longitude</label><input className="w-full border p-2 rounded bg-gray-100 text-gray-500" value={storeForm.longitude} readOnly /></div>
                    </div>
                </div>
            </div>
          )}

          {/* 3. FINANCEIRO */}
          {settingsTab === 'finance' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banco (Código)</label><input className="w-full border p-2 rounded" value={storeForm.bancoCodigo} onChange={e=>setStoreForm({...storeForm, bancoCodigo: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Banco</label><input className="w-full border p-2 rounded" value={storeForm.bancoNome} onChange={e=>setStoreForm({...storeForm, bancoNome: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Agência</label><input className="w-full border p-2 rounded" value={storeForm.agencia} onChange={e=>setStoreForm({...storeForm, agencia: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Conta</label><input className="w-full border p-2 rounded" value={storeForm.conta} onChange={e=>setStoreForm({...storeForm, conta: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Conta</label>
                        <select className="w-full border p-2 rounded bg-white" value={storeForm.tipoConta} onChange={e=>setStoreForm({...storeForm, tipoConta: e.target.value})}>
                            <option value="corrente">Corrente</option>
                            <option value="poupanca">Poupança</option>
                        </select>
                    </div>
                    
                    <div className="col-span-2 border-t pt-4 mt-2"><h4 className="font-bold text-gray-800 mb-4">Chave PIX</h4></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Chave</label>
                        <select className="w-full border p-2 rounded bg-white" value={storeForm.chavePixTipo} onChange={e=>setStoreForm({...storeForm, chavePixTipo: e.target.value})}>
                            <option value="">Selecione...</option>
                            <option value="cpf">CPF/CNPJ</option>
                            <option value="email">Email</option>
                            <option value="phone">Telefone</option>
                            <option value="random">Aleatória</option>
                        </select>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chave PIX</label><input className="w-full border p-2 rounded" value={storeForm.chavePixValor} onChange={e=>setStoreForm({...storeForm, chavePixValor: e.target.value})} /></div>
                 </div>
            </div>
          )}

          {/* 4. VISUAL */}
          {settingsTab === 'visual' && (
            <div className="space-y-6 animate-fade-in">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL do Logo</label><input className="w-full border p-2 rounded" value={storeForm.imageUrl} onChange={e=>setStoreForm({...storeForm, imageUrl: e.target.value})} placeholder="https://..." /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL do Banner</label><input className="w-full border p-2 rounded" value={storeForm.bannerUrl} onChange={e=>setStoreForm({...storeForm, bannerUrl: e.target.value})} placeholder="https://..." /></div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cor Primária</label><input type="color" className="w-full h-10 p-1 border rounded" value={storeForm.primaryColor} onChange={e=>setStoreForm({...storeForm, primaryColor: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cor Secundária</label><input type="color" className="w-full h-10 p-1 border rounded" value={storeForm.secondaryColor} onChange={e=>setStoreForm({...storeForm, secondaryColor: e.target.value})} /></div>
                </div>
            </div>
          )}

          {/* 5. IA & INTEGRAÇÕES */}
          {settingsTab === 'ai' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <h4 className="font-bold text-purple-900 mb-2 flex items-center"><Bot size={18} className="mr-2"/> Inteligência Artificial</h4>
                    <p className="text-sm text-purple-700 mb-4">Configure sua chave da OpenAI para gerar descrições automáticas de produtos.</p>
                    <div><label className="block text-xs font-bold text-purple-800 uppercase mb-1">OpenAI API Key</label><input type="password" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={storeForm.openaiKey} onChange={e=>setStoreForm({...storeForm, openaiKey: e.target.value})} placeholder="sk-..." /></div>
                 </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-white pt-4 border-t mt-8 flex justify-end">
            <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg">Salvar Alterações</button>
          </div>

        </form>
      </div>
    </div>
  );
}
