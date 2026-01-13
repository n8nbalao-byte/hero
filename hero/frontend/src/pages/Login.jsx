import React, { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '20px'
  },
  card: {
    maxWidth: '400px',
    width: '100%',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    marginBottom: '20px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  btn: (loading) => ({
    width: '100%',
    padding: '14px',
    backgroundColor: loading ? '#b30000' : '#DC0000',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: '0.3s'
  })
};

function Login() {
  const { signIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Hook location
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- GOOGLE LOGIN ---
  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "SEU_CLIENT_ID_AQUI", // Fallback para evitar erro fatal se não configurado
        callback: handleGoogleCallback
      });
      google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: "100%", text: "continue_with" }
      );
    }
  }, []);

  async function handleGoogleCallback(response) {
    setIsLoading(true);
    try {
      // Envia o token do Google para o backend
      const res = await api.post('/login/google', { id_token: response.credential });
      
      // O backend deve retornar { user, token } igual ao login normal
      // Precisamos atualizar o AuthContext manualmente ou usar uma função exposta
      // Como o signIn do contexto espera email/senha, vamos fazer login manual aqui:
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Força um reload ou atualiza estado (ideal seria expor setAuth no contexto, mas reload funciona)
      window.location.href = res.data.user.tipo === 'shop_owner' ? '/shop-dashboard' : 
                             res.data.user.tipo === 'courier' ? '/courier-dashboard' : 
                             res.data.user.tipo === 'admin' ? '/admin-dashboard' : '/';
                             
    } catch (err) {
      console.error(err);
      setError('Erro ao autenticar com Google.');
      setIsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await signIn(email, senha);
      // Redirecionamento baseado no tipo
      if (user.tipo === 'shop_owner') navigate('/shop-dashboard');
      else if (user.tipo === 'courier') navigate('/courier-dashboard');
      else if (user.tipo === 'admin') navigate('/admin-dashboard');
      else navigate('/');
    } catch (err) {
      setError('Falha no login. Verifique seus dados.');
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Bem-vindo de volta!</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Acesse sua conta para continuar</p>
        
        {error && <div style={{ color: '#DC0000', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Seu E-mail ou Usuário" 
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Sua Senha" 
            style={styles.input}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          
          <button type="submit" style={styles.btn(isLoading)} disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        <div style={{ margin: '20px 0', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fff', padding: '0 10px', color: '#999', fontSize: '12px' }}>OU</span>
        </div>

        <div id="googleBtn" style={{ display: 'flex', justifyContent: 'center' }}></div>

        <div style={{ marginTop: '25px' }}>
          <span style={{ color: '#666' }}>Ainda não tem conta? </span>
          <Link to="/register" style={{ color: '#DC0000', fontWeight: 'bold', textDecoration: 'none' }}>
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;