import React, { useState, useEffect } from 'react';
import { Database, Search, Calculator, Wand2, Loader2, CheckCircle, X, Key } from 'lucide-react';
import api from '../../services/api';

export default function ImportTab({ store, onRefresh }) {
  const [importSource, setImportSource] = useState('kabum'); 
  const [importCategory, setImportCategory] = useState('Informática');
  const [availableCategories, setAvailableCategories] = useState([]);

  const fetchCategories = () => {
    api.get('/categories')
      .then(res => setAvailableCategories(res.data))
      .catch(err => console.error("Erro ao carregar categorias:", err));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState([]); 
  const [selectedItems, setSelectedItems] = useState([]); 
  const [profitMargin, setProfitMargin] = useState(30); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);

  const [bulkCategoryInput, setBulkCategoryInput] = useState('');
  
  // State for API Key Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const parseCurrency = (str) => {
    if (!str) return 0;
    let clean = str.replace(/[^\d,.]/g, ''); 
    if (clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g, '').replace(',', '.');
    else if (clean.includes(',')) clean = clean.replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const handleBulkCategoryChange = () => {
    if (!bulkCategoryInput) return alert('Digite ou selecione uma categoria.');
    if (selectedItems.length === 0) return alert('Selecione itens na tabela.');
    
    setParsedItems(prev => prev.map((item, idx) => {
      if (selectedItems.includes(idx)) {
        return { ...item, category: bulkCategoryInput };
      }
      return item;
    }));
    alert('Categoria atualizada para os itens selecionados!');
  };

  const handleAnalyzeText = () => {
    if (!rawText.trim()) return alert('Cole o texto.');
    const lines = rawText.split('\n').filter(l => l.trim().length > 5);
    const detected = [];
    lines.forEach(line => {
      const cols = line.split('\t');
      let item = { _tempId: Math.random().toString(36).substr(2, 9), name: '', cost: 0, imageUrl: '', supplier: importSource.toUpperCase() };
      if (importSource === 'kyte' && cols.length >= 4) { item.original_link=cols[0]; item.imageUrl=cols[1]; item.name=cols[2]; item.cost=parseCurrency(cols[3]); }
      else if (importSource === 'kalunga' && cols.length >= 3) { item.original_link=cols[0]; item.imageUrl=cols[1]; item.name=cols[2]; const ps=cols.filter(c=>c&&c.includes('R$')).map(c=>parseCurrency(c)); item.cost=ps.length?Math.min(...ps):0; }
      else if (importSource === 'kabum') { const idx=cols.findIndex(c=>c.includes('images.kabum')); if(idx!==-1){ item.imageUrl=cols[idx]; item.name=cols[idx+1]; item.original_link=cols.find(c=>c.includes('kabum')); const ps=cols.slice(idx+2).filter(c=>c.includes('R$')).map(c=>parseCurrency(c)); item.cost=ps.length?Math.min(...ps):0; } }
      else if (importSource === 'ml') { const img=cols.find(c=>c.includes('http')&&(c.includes('.jpg')||c.includes('.webp'))); if(img){ item.imageUrl=img.trim(); item.name=cols.find(c=>c.length>25&&!c.includes('http'))||'Produto ML'; item.original_link=cols.find(c=>c.includes('mercadolivre')); const m=line.match(/R\$\s*(\d{1,3}(?:\.?\d{3})*)\s*,\s*(\d{2})/); if(m) item.cost=parseFloat(m[1].replace('.','')+'.'+m[2]); } }
      if (item.name && item.cost >= 0) { 
        item.price = item.cost * (1 + profitMargin / 100); 
        item.category = importCategory || 'Informática';
        detected.push(item); 
      }
    });
    setParsedItems(detected);
  };

  const handleBulkAiGeneration = async () => {
    if (!store.openaiKey && !store.openai_key) return alert('Configure sua Chave API nas Configurações.');
    if (selectedItems.length === 0) return alert('Selecione produtos na tabela.');
    
    if (!confirm('Os produtos serão gerados e salvos automaticamente no catálogo um a um. Deseja continuar?')) return;

    setGeneratingId('bulk');
    
    // Create a copy of items to process based on selection
    const itemsToProcess = selectedItems.map(idx => parsedItems[idx]).filter(i => i && !i.description); // Only process those without description? Or force re-generate? User said "gerar descrição". Usually implies new.
    
    // We will iterate through itemsToProcess.
    // However, since we modify parsedItems (remove them), indices in selectedItems become invalid.
    // So we should use the item objects themselves (via _tempId).
    
    let processedCount = 0;

    for (const item of itemsToProcess) {
      try {
        // 1. Generate Description
        const { data } = await api.post('/ai/generate', { productName: item.name, productPrice: item.price });
        const description = data.description;
        
        // 2. Save to Catalog Immediately
        const productToSave = { ...item, description };
        await api.post(`/stores/${store.id}/products`, productToSave);
        
        // 3. Update UI: Remove from list
        setParsedItems(prev => prev.filter(p => p._tempId !== item._tempId));
        setSelectedItems(prev => prev.filter(idx => parsedItems[idx]?._tempId !== item._tempId)); // This is tricky because indices shift.
        // Actually, better to clear selection of processed item or just re-sync selection?
        // If we remove the item from parsedItems, the selection indices for *other* items might shift if they are after this one.
        // Simplest: Clear selection for this item. But since we remove it, we just need to ensure selectedItems doesn't point to invalid indices.
        // If we remove from parsedItems, we should probably just reset selectedItems or let the user re-select remaining.
        // But the loop is running.
        
        // Actually, if we remove items one by one, the indices of subsequent items in `parsedItems` change immediately.
        // This breaks `selectedItems` logic if we rely on indices.
        // BUT `itemsToProcess` is already a captured array of objects. We don't need indices for the loop.
        // We only need to update `parsedItems` state.
        
        processedCount++;
        
      } catch (e) { 
        console.error(`Erro processando item ${item.name}`, e);
        // Optional: Mark as error in UI?
      }
    }
    
    // Clean up selection at the end
    setSelectedItems([]);
    setGeneratingId(null);
    onRefresh(); // Refresh catalog
    fetchCategories(); // Refresh categories
    alert(`Processo concluído! ${processedCount} produtos salvos no catálogo.`);
  };

  const handleSaveBulk = async () => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);
    try {
      const { data } = await api.post(`/stores/${store.id}/products/bulk`, parsedItems);
      alert(`Sucesso! ${data.count} cadastrados.`);
      setParsedItems([]); setRawText(''); 
      onRefresh();
      fetchCategories(); // Atualiza categorias disponíveis
    } catch (e) { alert('Erro ao salvar.'); } finally { setIsProcessing(false); }
  };

  useEffect(() => { if (parsedItems.length > 0) setParsedItems(p => p.map(i => ({...i, price: i.cost*(1+profitMargin/100)}))); }, [profitMargin]);

  return (
    <div className="bg-white rounded-xl border shadow-sm max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)] animate-fade-in">
      <div className="p-5 border-b">
        <h2 className="text-lg font-bold flex items-center"><Database className="mr-2 text-gray-500" size={20}/> Importação Inteligente</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4 border-b pb-4 items-center justify-between">
            <div className="flex gap-4">
              {['kabum','ml','kalunga','kyte'].map(s=><button key={s} onClick={()=>{setImportSource(s);setParsedItems([]);setRawText('')}} className={`pb-2 text-sm font-medium border-b-2 capitalize transition ${importSource===s?'border-black text-black':'border-transparent text-gray-400'}`}>{s}</button>)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500">Categoria Destino:</span>
              <input 
                list="import-category-options" 
                className="border p-2 rounded text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-black w-40" 
                value={importCategory} 
                onChange={e=>setImportCategory(e.target.value)}
                placeholder="Selecione ou digite..."
              />
              <datalist id="import-category-options">
                {availableCategories.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
                {availableCategories.length === 0 && (
                  <>
                    <option value="Informática" />
                    <option value="Hardware" />
                    <option value="Periféricos" />
                    <option value="Computadores" />
                    <option value="Notebooks" />
                    <option value="Smartphones" />
                    <option value="Acessórios" />
                    <option value="Games" />
                    <option value="Cabos" />
                    <option value="Impressoras" />
                    <option value="Eletrônicos" />
                    <option value="Casa Inteligente" />
                    <option value="Áudio e Vídeo" />
                  </>
                )}
              </datalist>
            </div>
          </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col p-5">
        {parsedItems.length === 0 ? (
          <div className="flex-1 flex flex-col"><textarea className="flex-1 p-4 bg-gray-50 border rounded-md font-mono text-xs outline-none resize-none" placeholder="Cole o texto copiado aqui..." value={rawText} onChange={e=>setRawText(e.target.value)}/><div className="mt-4 flex justify-end"><button onClick={handleAnalyzeText} className="bg-black text-white px-6 py-2 rounded-md font-medium flex items-center"><Search className="mr-2" size={16}/> Analisar Dados</button></div></div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center">
                    <Calculator size={16} className="mr-2 text-blue-600"/> Margem: 
                    <input type="number" value={profitMargin} onChange={e=>setProfitMargin(Number(e.target.value))} className="w-14 ml-2 p-1 text-center font-bold border rounded"/> %
                </div>
                <div className="w-px h-4 bg-blue-200"></div>
                <div className="flex items-center text-purple-700 font-medium">
                    <Wand2 size={16} className="mr-2"/>
                    {generatingId==='bulk' ? (
                        <span className="flex items-center">Gerando... <Loader2 className="ml-2 animate-spin" size={14}/></span>
                    ) : (
                        <button onClick={handleBulkAiGeneration} className="hover:underline">Gerar Descrição p/ Selecionados</button>
                    )}
                </div>
                {selectedItems.length > 0 && (
                    <>
                        <div className="w-px h-4 bg-blue-200"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600">Mudar Categoria:</span>
                            <input 
                                list="import-category-options" 
                                className="border p-1 rounded text-xs w-32" 
                                placeholder="Nova Categoria..."
                                value={bulkCategoryInput}
                                onChange={e => setBulkCategoryInput(e.target.value)}
                            />
                            <button onClick={handleBulkCategoryChange} className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700">Aplicar</button>
                        </div>
                    </>
                )}
              </div>
              <div className="text-xs text-blue-700">{parsedItems.length} itens</div>
            </div>
            <div className="flex-1 overflow-auto border rounded-md">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0 z-10">
                    <tr>
                        <th className="p-3 w-8"><input type="checkbox" onChange={e=>{if(e.target.checked) setSelectedItems(parsedItems.map((_,i)=>i)); else setSelectedItems([])}} checked={selectedItems.length===parsedItems.length && parsedItems.length>0}/></th>
                        <th className="p-3">Img</th>
                        <th className="p-3 w-1/4">Produto</th>
                        <th className="p-3 w-1/6">Categoria</th>
                        <th className="p-3">Descrição (IA)</th>
                        <th className="p-3">Custo</th>
                        <th className="p-3">Venda</th>
                        <th className="p-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {parsedItems.map((item, idx) => (
                        <tr key={idx} className={`hover:bg-gray-50 ${selectedItems.includes(idx)?'bg-blue-50/30':''}`}>
                            <td className="p-3 align-top"><input type="checkbox" checked={selectedItems.includes(idx)} onChange={e=>{if(e.target.checked) setSelectedItems([...selectedItems,idx]); else setSelectedItems(selectedItems.filter(i=>i!==idx))}}/></td>
                            <td className="p-3 align-top"><div className="w-10 h-10 border rounded bg-white p-0.5 overflow-hidden"><img src={item.imageUrl} className="w-full h-full object-contain"/></div></td>
                            <td className="p-3 align-top"><textarea value={item.name} onChange={e=>{const l=[...parsedItems];l[idx].name=e.target.value;setParsedItems(l)}} className="w-full bg-transparent border-none p-0 text-xs font-medium resize-none h-10"/></td>
                            <td className="p-3 align-top">
                                <input 
                                    list="import-category-options"
                                    value={item.category || ''} 
                                    onChange={e=>{const l=[...parsedItems];l[idx].category=e.target.value;setParsedItems(l)}} 
                                    className="w-full bg-transparent border-b border-gray-200 p-0 text-xs focus:border-blue-500 outline-none"
                                />
                            </td>
                            <td className="p-3 align-top"><div className="text-xs text-gray-500 h-16 overflow-y-auto border rounded p-1 bg-white">{item.description?<div dangerouslySetInnerHTML={{__html: item.description}}/>:<span className="italic text-gray-300">Sem descrição</span>}</div></td>
                            <td className="p-3 text-xs text-gray-500 align-top pt-3">R$ {item.cost.toFixed(2)}</td>
                            <td className="p-3 align-top pt-2"><input type="number" step="0.01" value={item.price.toFixed(2)} onChange={e=>{const l=[...parsedItems];l[idx].price=Number(e.target.value);setParsedItems(l)}} className="w-20 p-1 border rounded text-xs font-bold text-green-700"/></td>
                            <td className="p-3 text-right align-top pt-3"><button onClick={()=>setParsedItems(parsedItems.filter((_, i)=>i!==idx))} className="text-gray-300 hover:text-red-500"><X size={16}/></button></td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3 pt-4 border-t"><button onClick={()=>{setParsedItems([]);setRawText('')}} className="px-4 py-2 text-sm text-gray-500">Descartar</button><button onClick={handleSaveBulk} disabled={isProcessing} className="bg-green-600 text-white px-6 py-2 rounded-md font-bold hover:bg-green-700 disabled:opacity-50 flex items-center">{isProcessing?<Loader2 className="animate-spin mr-2"/>:<CheckCircle className="mr-2" size={18}/>} Confirmar Cadastro</button></div>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-4 text-purple-700">
              <div className="p-2 bg-purple-100 rounded-full">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-bold">Configurar Inteligência Artificial</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Configure sua chave da OpenAI para gerar descrições automáticas de produtos. 
              Ela será salva nas configurações da loja.
            </p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">OpenAI API Key</label>
              <input 
                type="text" 
                value={tempApiKey}
                onChange={e => setTempApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveKeyAndGenerate}
                disabled={isSavingKey || !tempApiKey}
                className="px-4 py-2 text-sm bg-purple-600 text-white font-bold rounded hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {isSavingKey ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                Salvar e Gerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
