import React, { useState, useMemo } from 'react';
import { Search, Trash, Plus, Edit, Key, Loader2, X } from 'lucide-react';
import api from '../../services/api';

export default function ProductsTab({ store, products, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('name_asc');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);

  // State for API Key Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const fetchCategories = () => {
    api.get('/categories')
      .then(res => setAvailableCategories(res.data))
      .catch(err => console.error("Erro ao carregar categorias:", err));
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (searchTerm) list = list.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    list.sort((a,b) => sortOrder==='price_asc'?Number(a.preco)-Number(b.preco) : sortOrder==='price_desc'?Number(b.preco)-Number(a.preco) : a.nome.localeCompare(b.nome));
    return list;
  }, [products, searchTerm, sortOrder]);

  const toggleProductSelection = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const [bulkCategory, setBulkCategory] = useState('');
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [processingBulk, setProcessingBulk] = useState(false);

  const handleSaveKeyAndGenerate = async () => {
    if (!tempApiKey.trim() || !tempApiKey.startsWith('sk-')) {
        alert('Chave inválida. Deve começar com "sk-".');
        return;
    }

    setIsSavingKey(true);
    try {
        await api.put('/my-store', { openaiKey: tempApiKey });
        
        // Update local store prop reference visually
        if (store) store.openai_key = tempApiKey;
        
        if (onRefresh) onRefresh();
        
        setShowKeyModal(false);
        // Retry generation
        await executeAiGeneration();
        
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar chave API.');
    } finally {
        setIsSavingKey(false);
    }
  };

  const executeAiGeneration = async () => {
    if (!confirm(`Gerar descrição para ${selectedProductIds.length} produtos? Isso pode levar um tempo.`)) return;
    
    setProcessingBulk(true);
    let successCount = 0;
    
    for (const id of selectedProductIds) {
      const product = products.find(p => p.id === id);
      if (!product) continue;
      
      try {
        const { data } = await api.post('/ai/generate', { 
            productName: product.nome, 
            productPrice: product.preco 
        });
        
        if (data.description) {
            await api.put(`/products/${id}`, { ...product, descricao: data.description });
            successCount++;
        }
      } catch (e) {
        console.error(`Erro ao gerar descrição para produto ${id}:`, e);
      }
    }
    
    alert(`Concluído! Descrições geradas para ${successCount} produtos.`);
    setProcessingBulk(false);
    onRefresh();
  };

  const handleBulkAiDescription = async () => {
    // Check for key (prop or local update)
    const hasKey = store?.openai_key || store?.openaiKey;
    if (!hasKey) {
        setShowKeyModal(true);
        return;
    }
    
    await executeAiGeneration();
  };

  const handleBulkCategoryUpdate = async () => {
    if (!bulkCategory) return alert('Selecione uma categoria.');
    
    setProcessingBulk(true);
    try {
        await Promise.all(selectedProductIds.map(id => {
            const product = products.find(p => p.id === id);
            return api.put(`/products/${id}`, { ...product, categoria: bulkCategory });
        }));
        alert('Categorias atualizadas com sucesso!');
        setIsBulkCategoryModalOpen(false);
        setBulkCategory('');
        setSelectedProductIds([]);
        onRefresh();
        fetchCategories();
    } catch (e) {
        console.error(e);
        alert('Erro ao atualizar categorias.');
    } finally {
        setProcessingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedProductIds.length} produtos?`)) return;
    try {
      await Promise.all(selectedProductIds.map(id => api.delete(`/products/${id}`)));
      alert('Produtos excluídos com sucesso!');
      setSelectedProductIds([]);
      onRefresh();
      fetchCategories();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir alguns produtos.');
    }
  };

  const handleDeleteProduct = async (id) => { 
    if (!confirm('Excluir?')) return; 
    try { 
      await api.delete(`/products/${id}`); 
      onRefresh(); 
      fetchCategories();
    } catch (e) { 
      alert('Erro deletar'); 
    } 
  };

  const handleSaveProduct = async (e) => { 
    e.preventDefault(); 
    if (!store?.id) return; 
    try { 
      if (editingProduct) await api.put(`/products/${editingProduct.id}`, productForm); 
      else await api.post(`/stores/${store.id}/products`, productForm); 
      setIsProductModalOpen(false); 
      setEditingProduct(null); 
      onRefresh(); 
      fetchCategories();
    } catch (e) { 
      alert('Erro salvar'); 
    } 
  };

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full max-h-[calc(100vh-100px)] animate-fade-in">
        <div className="p-5 border-b flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input className="pl-9 pr-4 py-2 border rounded-md text-sm w-full outline-none focus:border-black" placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <div className="flex gap-2 items-center">
            {selectedProductIds.length > 0 && (
              <div className="flex items-center gap-2 mr-2 bg-red-50 text-red-700 px-3 py-1 rounded-md border border-red-100 animate-fade-in">
                <span className="text-xs font-bold">{selectedProductIds.length} selecionados</span>
                <button 
                  id="btn-bulk-delete"
                  onClick={handleBulkDelete}
                  className="text-xs bg-white border border-red-200 hover:bg-red-100 px-2 py-1 rounded font-bold flex items-center gap-1 transition"
                >
                  <Trash size={12}/> Excluir Todos
                </button>
              </div>
            )}
            <select className="border rounded-md text-sm px-3 py-2 outline-none" value={sortOrder} onChange={e=>setSortOrder(e.target.value)}><option value="name_asc">Nome (A-Z)</option><option value="price_asc">Menor Preço</option><option value="price_desc">Maior Preço</option></select>
            <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium flex items-center" onClick={()=>{setEditingProduct(null);setProductForm({});setIsProductModalOpen(true)}}><Plus size={16} className="mr-2"/> Novo</button>
          </div>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0">
              <tr>
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                    onChange={toggleAllProducts}
                  />
                </th>
                <th className="p-4">Produto</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Estoque</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map(p=>(
                <tr key={p.id} className={`hover:bg-gray-50 transition ${selectedProductIds.includes(p.id) ? 'bg-red-50/30' : ''}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      checked={selectedProductIds.includes(p.id)}
                      onChange={() => toggleProductSelection(p.id)}
                    />
                  </td>
                  <td className="p-4 flex items-center">
                    <img src={p.imagem_url||'https://via.placeholder.com/40'} className="h-10 w-10 rounded border mr-3 object-cover"/>
                    <span className="text-sm font-medium">{p.nome}</span>
                  </td>
                  <td className="p-4 text-sm">R$ {Number(p.preco).toFixed(2)}</td>
                  <td className="p-4 text-sm">{p.estoque}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button className="text-gray-400 hover:text-blue-600" onClick={()=>{setEditingProduct(p);setProductForm(p);setIsProductModalOpen(true)}}><Edit size={18}/></button>
                    <button onClick={()=>handleDeleteProduct(p.id)} className="text-gray-400 hover:text-red-600"><Trash size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Bulk Category */}
      {isBulkCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-sm">Alterar Categoria em Massa</h3>
                    <button onClick={() => setIsBulkCategoryModalOpen(false)} className="text-gray-400 hover:text-black"><X size={18}/></button>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-500 mb-3">Selecione a nova categoria para os <b>{selectedProductIds.length}</b> produtos selecionados:</p>
                    <input 
                        list="category-options" 
                        className="w-full border p-2 rounded mb-4 outline-none focus:ring-1 focus:ring-black" 
                        value={bulkCategory} 
                        onChange={e => setBulkCategory(e.target.value)} 
                        placeholder="Selecione ou digite..."
                        autoFocus
                    />
                    <datalist id="category-options">
                        {availableCategories.map((cat, idx) => (
                            <option key={idx} value={cat} />
                        ))}
                    </datalist>
                    <button 
                        onClick={handleBulkCategoryUpdate} 
                        disabled={processingBulk}
                        className="w-full bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
                    >
                        {processingBulk ? 'Atualizando...' : 'Confirmar Atualização'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal Renderizado Diretamente para evitar re-montagem e perda de foco */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-4 space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label><input className="w-full border p-2 rounded" value={productForm.nome || ''} onChange={e => setProductForm({...productForm, nome: e.target.value})} required autoFocus/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço</label><input type="number" step="0.01" className="w-full border p-2 rounded" value={productForm.preco || ''} onChange={e => setProductForm({...productForm, preco: e.target.value})} required/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estoque</label><input type="number" className="w-full border p-2 rounded" value={productForm.estoque || ''} onChange={e => setProductForm({...productForm, estoque: e.target.value})} /></div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                <input 
                  list="category-options" 
                  className="w-full border p-2 rounded" 
                  value={productForm.categoria || ''} 
                  onChange={e => setProductForm({...productForm, categoria: e.target.value})} 
                  placeholder="Selecione ou digite..."
                />
                <datalist id="category-options">
                  {availableCategories.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagem URL</label><input className="w-full border p-2 rounded" value={productForm.imagem_url || ''} onChange={e => setProductForm({...productForm, imagem_url: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label><textarea className="w-full border p-2 rounded resize-none" rows={3} value={productForm.descricao || ''} onChange={e => setProductForm({...productForm, descricao: e.target.value})} /></div>
              <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800">Salvar Produto</button>
            </form>
          </div>
        </div>
      )}

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
    </>
  );
}
