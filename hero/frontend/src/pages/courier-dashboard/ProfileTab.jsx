import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ProfileTab({ user }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    avatar_url: user?.avatar_url || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Atualiza form se user mudar (ex: após upload e reload do contexto, se houvesse)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        phone: user.telefone || user.phone || '', // Check both fields
        whatsapp: user.whatsapp || '',
        avatar_url: user.avatar_url || ''
      }));
    }
  }, [user]);

  const uploadAvatar = async (file) => {
    const data = new FormData();
    data.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload', data);
      // Atualiza localmente a URL para preview
      setFormData(prev => ({ ...prev, avatar_url: res.data.url }));
      alert('Foto enviada com sucesso! Não esqueça de clicar em Salvar Alterações para confirmar.');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Envia todos os dados, incluindo a nova URL do avatar
      await api.put('/users/profile', formData);
      alert('✅ Dados atualizados com sucesso!');
    } catch (error) {
      console.error(error);
      alert('❌ Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#666' }}>
      <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Meus Dados</h3>
      
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* AVATAR SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                marginBottom: '10px',
                border: '3px solid #f0f0f0',
                backgroundColor: '#eee'
            }}>
                <img 
                    src={formData.avatar_url || 'https://via.placeholder.com/150'} 
                    alt="Perfil" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            </div>
            <label style={{ 
                padding: '8px 16px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #ddd', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#555'
            }}>
                {uploading ? 'Enviando...' : 'Alterar Foto'}
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    style={{ display: 'none' }} 
                    disabled={uploading}
                />
            </label>
        </div>

        <form onSubmit={handleSave}>
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>NOME COMPLETO (BLOQUEADO)</label>
                <input 
                    type="text" 
                    value={user?.nome || ''} 
                    disabled 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f0f0f0', color: '#888' }}
                />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>CPF / ID (BLOQUEADO)</label>
                <input 
                    type="text" 
                    value={user?.id || ''} 
                    disabled 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f0f0f0', color: '#888' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>EMAIL</label>
                <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>TELEFONE (CELULAR)</label>
                <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>WHATSAPP</label>
                <input 
                    type="tel" 
                    value={formData.whatsapp} 
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
            </div>

            <button 
                type="submit" 
                disabled={loading || uploading}
                style={{ width: '100%', padding: '15px', backgroundColor: '#DC0000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (loading || uploading) ? 'not-allowed' : 'pointer' }}
            >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </form>
      </div>
    </div>
  );
}
