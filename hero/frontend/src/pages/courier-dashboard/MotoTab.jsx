import React, { useState, useEffect } from 'react';
import { FaMotorcycle, FaCar, FaBicycle, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import api from '../../services/api';

export default function MotoTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ type: 'Moto', plate: '', model: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/users/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Erro ao buscar veículos', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/users/vehicles/${editingId}`, formData);
        alert('✅ Veículo atualizado!');
      } else {
        await api.post('/users/vehicles', formData);
        alert('✅ Veículo adicionado!');
      }
      
      setFormData({ type: 'Moto', plate: '', model: '' });
      setEditingId(null);
      setShowForm(false);
      fetchVehicles();
    } catch (error) {
      alert('❌ Erro ao salvar veículo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este veículo?')) return;
    try {
      await api.delete(`/users/vehicles/${id}`);
      fetchVehicles();
    } catch (error) {
      alert('Erro ao excluir.');
    }
  };

  const handleEdit = (v) => {
    setFormData({ type: v.type, plate: v.plate, model: v.model });
    setEditingId(v.id);
    setShowForm(true);
  };

  const getIcon = (type) => {
      if (type === 'Carro') return <FaCar size={24} color="#555" />;
      if (type === 'Bicicleta') return <FaBicycle size={24} color="#555" />;
      return <FaMotorcycle size={24} color="#555" />;
  };

  return (
    <div style={{ padding: '20px', color: '#666' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Meus Veículos</h3>
      
      {!showForm ? (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {vehicles.map(v => (
                    <div key={v.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {getIcon(v.type)}
                            <div>
                                <p style={{ fontWeight: 'bold', margin: 0, color: '#333' }}>{v.model}</p>
                                <p style={{ fontSize: '12px', margin: 0, color: '#888' }}>{v.plate} • {v.type}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleEdit(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007bff' }}><FaEdit /></button>
                            <button onClick={() => handleDelete(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => { setShowForm(true); setEditingId(null); setFormData({ type: 'Moto', plate: '', model: '' }); }}
                style={{ marginTop: '20px', width: '100%', padding: '15px', backgroundColor: '#DC0000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
                <FaPlus /> Adicionar Veículo
            </button>
        </>
      ) : (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h4 style={{ marginBottom: '15px' }}>{editingId ? 'Editar Veículo' : 'Novo Veículo'}</h4>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>TIPO</label>
                    <select 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                        <option value="Moto">Moto</option>
                        <option value="Carro">Carro</option>
                        <option value="Bicicleta">Bicicleta</option>
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>MODELO / COR</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Honda CG 160 Vermelha"
                        value={formData.model} 
                        onChange={e => setFormData({...formData, model: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>PLACA</label>
                    <input 
                        type="text" 
                        placeholder="ABC-1234"
                        value={formData.plate} 
                        onChange={e => setFormData({...formData, plate: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        required
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        type="button" 
                        onClick={() => setShowForm(false)}
                        style={{ flex: 1, padding: '15px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ flex: 1, padding: '15px', backgroundColor: '#DC0000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}