import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '40px 20px'
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  roleSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginBottom: '25px'
  },
  roleBox: (selected) => ({
    padding: '15px 10px',
    borderRadius: '16px',
    border: selected ? '2px solid #DC0000' : '2px solid #f0f0f0',
    backgroundColor: selected ? '#fff4f4' : '#fff',
    textAlign: 'center',
    cursor: 'pointer',
    transition: '0.3s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  }),
  inputGroup: { marginBottom: '18px', textAlign: 'left' },
  label: { display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#444' },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  extraSection: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '1px dashed #ddd'
  },
  submitBtn: (loading) => ({
    width: '100%',
    padding: '16px',
    backgroundColor: loading ? '#ccc' : '#DC0000',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: loading ? 'none' : '0 4px 15px rgba(220, 0, 0, 0.2)',
    transition: '0.3s'
  })
};

function Register() {
  const { signUp } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados dos campos
  const [formData, setFormData] = useState({
    nome: '', email: '', senha: '', telefone: '',
    veiculo_tipo: '', veiculo_placa: '', whatsapp: '', foto_perfil: '', nome_loja: ''
  });

  // --- GOOGLE REGISTER ---
  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);

  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "SEU_CLIENT_ID_AQUI",
        callback: handleGoogleCallback
      });
      google.accounts.id.renderButton(
        document.getElementById("googleBtnRegister"),
        { theme: "outline", size: "large", width: "100%", text: "signup_with" }
      );
    }
  }, []);

  async function handleGoogleCallback(response) {
    setLoading(true);
    try {
      const currentRole = roleRef.current;
      const res = await api.post('/login/google', { 
        id_token: response.credential, 
        role: currentRole 
      });
      
      // Login Manual
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      alert(`Bem-vindo! Conta criada como ${currentRole === 'client' ? 'Cliente' : currentRole === 'courier' ? 'Entregador' : 'Lojista'}.`);

      window.location.href = res.data.user.tipo === 'shop_owner' ? '/shop-dashboard' : 
                             res.data.user.tipo === 'courier' ? '/courier-dashboard' : '/';

    } catch (err) {
      console.error(err);
      setError('Erro ao criar conta com Google.');
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        telefone: formData.telefone,
        tipo: role,
        // Campos condicionais
        nome_loja: role === 'shop_owner' ? formData.nome_loja : undefined,
        veiculo_tipo: role === 'courier' ? formData.veiculo_tipo : undefined,
        veiculo_placa: role === 'courier' ? formData.veiculo_placa : undefined,
        whatsapp: role === 'courier' ? formData.whatsapp : undefined,
        foto_perfil: role === 'courier' ? formData.foto_perfil : undefined
      });

      alert('Cadastro realizado com sucesso! Bem-vindo ao time.');
      navigate('/login');
    } catch (err) {
      setError('Ops! Algo deu errado. Verifique se o e-mail já está em uso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '5px' }}>Criar Conta</h2>
        <p style={{ textAlign: 'center', color: '#777', marginBottom: '30px', fontSize: '14px' }}>
          Escolha seu perfil e comece agora
        </p>

        {error && <div style={{ color: '#DC0000', textAlign: 'center', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}

        {/* SELETOR DE PERFIL */}
        <div style={styles.roleSelector}>
          <div onClick={() => setRole('client')} style={styles.roleBox(role === 'client')}>
            <span style={{ fontSize: '24px' }}>🛒</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Cliente</span>
          </div>
          <div onClick={() => setRole('courier')} style={styles.roleBox(role === 'courier')}>
            <span style={{ fontSize: '24px' }}>🏍️</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Entregador</span>
          </div>
          <div onClick={() => setRole('shop_owner')} style={styles.roleBox(role === 'shop_owner')}>
            <span style={{ fontSize: '24px' }}>🏪</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Lojista</span>
          </div>
        </div>

        {/* GOOGLE SIGNUP BUTTON */}
        <div style={{ marginBottom: '25px' }}>
             <div id="googleBtnRegister"></div>
             <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
               <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
               <span style={{ padding: '0 10px', color: '#999', fontSize: '12px' }}>OU EMAIL</span>
               <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
             </div>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nome Completo</label>
            <input name="nome" style={styles.input} value={formData.nome} onChange={handleInputChange} placeholder="Como quer ser chamado?" required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input name="email" type="email" style={styles.input} value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input name="senha" type="password" style={styles.input} value={formData.senha} onChange={handleInputChange} placeholder="Sua senha secreta" required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Telefone / WhatsApp</label>
            <input name="telefone" style={styles.input} value={formData.telefone} onChange={handleInputChange} placeholder="(19) 99999-9999" required />
          </div>

          {/* CAMPOS EXTRAS LOJISTA */}
          {role === 'shop_owner' && (
            <div style={styles.extraSection}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nome da Loja</label>
                <input name="nome_loja" style={styles.input} value={formData.nome_loja} onChange={handleInputChange} placeholder="Ex: Hamburgueria Top" required />
              </div>
            </div>
          )}

          {/* CAMPOS EXTRAS MOTOBOY */}
          {role === 'courier' && (
            <div style={styles.extraSection}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Tipo de Veículo</label>
                <select name="veiculo_tipo" style={styles.input} value={formData.veiculo_tipo} onChange={handleInputChange} required>
                  <option value="">Selecione...</option>
                  <option value="moto">Moto</option>
                  <option value="bike">Bicicleta</option>
                  <option value="carro">Carro</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Placa do Veículo</label>
                <input name="veiculo_placa" style={styles.input} value={formData.veiculo_placa} onChange={handleInputChange} placeholder="ABC-1234" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp para Contato</label>
                <input name="whatsapp" style={styles.input} value={formData.whatsapp} onChange={handleInputChange} placeholder="(19) 99999-9999" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>URL da Foto de Perfil (Opcional)</label>
                <input name="foto_perfil" style={styles.input} value={formData.foto_perfil} onChange={handleInputChange} placeholder="https://..." />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.submitBtn(loading)}>
            {loading ? 'Criando conta...' : 'CRIAR CONTA'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>Já tem uma conta? </span>
          <Link to="/login" style={{ color: '#DC0000', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;