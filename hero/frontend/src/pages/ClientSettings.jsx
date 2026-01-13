import React, { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto', // Removed top margin as it's inside a dashboard
    padding: '0 20px',
    color: '#333'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    padding: '30px',
    marginBottom: '30px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '25px',
    color: '#DC0000',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  button: {
    backgroundColor: '#DC0000',
    color: '#fff',
    padding: '15px 30px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
    transition: 'background-color 0.2s'
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '30px'
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #f0f0f0',
    marginBottom: '15px',
    backgroundColor: '#eee'
  },
  uploadButton: {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    display: 'inline-block'
  }
};

export default function ClientSettings() {
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    phone: '',
    whatsapp: '',
    birth_date: '',
    avatar_url: '',
    cpf: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        phone: user.telefone || user.phone || '', // Check both fields
        whatsapp: user.whatsapp || '',
        birth_date: user.data_nascimento || user.birth_date || '',
        avatar_url: user.avatar_url || '',
        cpf: user.cpf || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file) => {
    const data = new FormData();
    data.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload', data);
      const newAvatarUrl = res.data.url;
      
      // 1. Atualiza estado local para feedback imediato
      setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));

      // 2. Persiste automaticamente no backend
      await api.put('/users/profile', { avatar_url: newAvatarUrl });

      // 3. Atualiza contexto global (Header, Sidebar, etc)
      if (updateUser) {
        updateUser({ ...user, avatar_url: newAvatarUrl });
      }
      
      // Sem alert de sucesso conforme solicitado
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      // Mantemos apenas erro crítico no console ou UI sutil se necessário, 
      // mas removendo alert conforme tom do pedido "nao precisa de msg"
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        name: formData.nome // Backend expects 'name'
      };
      
      await api.put('/users/profile', payload);
      
      // Update local user context if needed
      if (updateUser) {
        updateUser({ ...user, ...formData });
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      // Silent fail or optional UI feedback
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Minhas Configurações</h2>

        <div style={styles.avatarContainer}>
          <div style={{ position: 'relative' }}>
            <img 
              src={formData.avatar_url || 'https://via.placeholder.com/150'} 
              alt="Perfil" 
              style={styles.avatar} 
            />
            {uploading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: '15px', // match avatar margin
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                Enviando...
              </div>
            )}
          </div>
          
          <label style={{...styles.uploadButton, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1}}>
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

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nome Completo</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              style={styles.input}
              placeholder="Seu nome completo"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Data de Aniversário</label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date ? formData.birth_date.split('T')[0] : ''}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>CPF (Para Pix/Notas)</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              style={styles.input}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="seu@email.com"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Telefone (Celular)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>WhatsApp</label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                style={styles.input}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{ 
              ...styles.button, 
              backgroundColor: success ? '#4CAF50' : '#DC0000', // Green on success
              opacity: (loading || uploading) ? 0.7 : 1,
              cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
            disabled={loading || uploading}
          >
            {loading ? 'Salvando...' : success ? 'Salvo com sucesso!' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
