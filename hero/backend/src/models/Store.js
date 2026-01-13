const { Model, DataTypes } = require('sequelize');

class Store extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      descricao: DataTypes.TEXT,
      telefone: DataTypes.STRING,
      endereco: DataTypes.STRING,
      categoria: DataTypes.STRING,
      imagem_url: DataTypes.TEXT,
      banner_url: DataTypes.TEXT,
      cor_primaria: DataTypes.STRING,
      cor_secundaria: DataTypes.STRING,
      tema: DataTypes.STRING,
      
      // Fiscal & Contact
      razao_social: DataTypes.STRING,
      nome_fantasia: DataTypes.STRING,
      cnpj: DataTypes.STRING,
      inscricao_estadual: DataTypes.STRING,
      responsavel_legal: DataTypes.STRING,
      cpf_responsavel: DataTypes.STRING,
      
      telefone_loja: DataTypes.STRING,
      whatsapp_pedidos: DataTypes.STRING,
      responsavel_nome: DataTypes.STRING,
      responsavel_telefone: DataTypes.STRING,
      responsavel_email: DataTypes.STRING,
      email_financeiro: DataTypes.STRING,

      // Address
      cep: DataTypes.STRING,
      logradouro: DataTypes.STRING,
      numero: DataTypes.STRING,
      complemento: DataTypes.STRING,
      bairro: DataTypes.STRING,
      cidade: DataTypes.STRING,
      uf: DataTypes.STRING,

      // Bank
      banco_codigo: DataTypes.STRING,
      banco_nome: DataTypes.STRING,
      agencia: DataTypes.STRING,
      conta: DataTypes.STRING,
      tipo_conta: DataTypes.STRING,
      chave_pix_tipo: DataTypes.STRING,
      chave_pix_valor: DataTypes.STRING,

      // Operational
      tempo_preparo_medio: DataTypes.INTEGER,
      pedido_minimo: DataTypes.DECIMAL(10, 2),
      status_loja: DataTypes.STRING,
      
      openai_key: DataTypes.STRING,
      latitude: DataTypes.DECIMAL(10, 8),
      longitude: DataTypes.DECIMAL(11, 8),
      horarios_funcionamento: DataTypes.TEXT, // JSON
    }, {
      sequelize,
      tableName: 'lojas',
      timestamps: false // Schema doesn't have created_at/updated_at by default managed by Sequelize unless aliased
    });
  }

  static associate(models) {
    this.hasMany(models.Product, { foreignKey: 'loja_id', as: 'products' });
    this.belongsTo(models.User, { foreignKey: 'usuario_id', as: 'owner' });
    this.hasMany(models.Order, { foreignKey: 'loja_id', as: 'orders' });
  }
}

module.exports = Store;
