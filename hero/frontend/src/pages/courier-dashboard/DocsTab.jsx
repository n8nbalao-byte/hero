import React, { useState } from 'react';
import { FaFileAlt, FaCloudUploadAlt, FaCheckCircle, FaCar, FaIdCard } from 'react-icons/fa';
import api from '../../services/api';

export default function DocsTab({ user }) {
  const [cnhFile, setCnhFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [loadingCnh, setLoadingCnh] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const handleUpload = async (file, type, setLoading) => {
    if (!file) return alert('Selecione um arquivo primeiro.');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      // 1. Upload do arquivo
      const response = await api.post('/upload', formData);
      const { url } = response.data;

      // 2. Salvar URL no perfil do usuário
      const updateData = {};
      if (type === 'cnh') updateData.cnh_url = url;
      if (type === 'document') updateData.document_url = url;

      await api.put('/users/profile', updateData);

      alert(`✅ ${type === 'cnh' ? 'CNH' : 'Documento'} enviado e salvo com sucesso!`);
    } catch (error) {
      console.error(error);
      alert('❌ Erro ao enviar documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#666' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Meus Documentos</h3>
      
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <FaFileAlt size={48} color="#DC0000" />
            <p style={{ marginTop: '10px' }}>Mantenha seus documentos atualizados para poder realizar entregas.</p>
        </div>

        {/* CNH Upload */}
        <div style={{ border: '2px dashed #ddd', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
            <FaIdCard size={32} color="#555" style={{ marginBottom: '10px' }} />
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Foto da CNH (Aberta)</p>
            <input 
                type="file" 
                onChange={e => setCnhFile(e.target.files[0])}
                style={{ fontSize: '14px', marginBottom: '10px' }}
            />
            <button 
                onClick={() => handleUpload(cnhFile, 'cnh', setLoadingCnh)}
                disabled={loadingCnh || !cnhFile}
                style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loadingCnh ? 'not-allowed' : 'pointer', opacity: !cnhFile ? 0.6 : 1 }}
            >
                {loadingCnh ? 'Enviando...' : 'Enviar CNH'}
            </button>
            {user?.cnh_url && <p style={{color: 'green', fontSize: '12px', marginTop: '5px'}}>✅ CNH já enviada</p>}
        </div>

        {/* Vehicle Document Upload */}
        <div style={{ border: '2px dashed #ddd', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
            <FaCar size={32} color="#555" style={{ marginBottom: '10px' }} />
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Documento do Veículo</p>
            <input 
                type="file" 
                onChange={e => setDocFile(e.target.files[0])}
                style={{ fontSize: '14px', marginBottom: '10px' }}
            />
            <button 
                onClick={() => handleUpload(docFile, 'document', setLoadingDoc)}
                disabled={loadingDoc || !docFile}
                style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loadingDoc ? 'not-allowed' : 'pointer', opacity: !docFile ? 0.6 : 1 }}
            >
                {loadingDoc ? 'Enviando...' : 'Enviar Documento'}
            </button>
            {user?.document_url && <p style={{color: 'green', fontSize: '12px', marginTop: '5px'}}>✅ Documento já enviado</p>}
        </div>

      </div>
    </div>
  );
}