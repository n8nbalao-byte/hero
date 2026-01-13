const { Model, DataTypes } = require('sequelize');

class Order extends Model {
  static init(sequelize) {
    super.init({
      valor_total: DataTypes.DECIMAL(10, 2),
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
      },
      endereco_entrega: DataTypes.TEXT,
      metodo_pagamento: DataTypes.STRING,
      taxa_entrega: DataTypes.DECIMAL(10, 2),
      codigo_entrega: DataTypes.STRING,
      codigo_coleta_loja: DataTypes.STRING,
      codigo_coleta_admin: DataTypes.STRING,
      etapa_status: DataTypes.STRING,
      latitude_entrega: DataTypes.DECIMAL(10, 8),
      longitude_entrega: DataTypes.DECIMAL(11, 8),
      lote_id: DataTypes.STRING,
    }, {
      sequelize,
      tableName: 'pedidos',
      createdAt: 'criado_em',
      updatedAt: false
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'cliente_id', as: 'client' });
    this.belongsTo(models.User, { foreignKey: 'motoboy_id', as: 'courier' });
    this.belongsTo(models.Store, { foreignKey: 'loja_id', as: 'store' });
    this.hasMany(models.OrderItem, { foreignKey: 'pedido_id', as: 'items' });
  }
}

module.exports = Order;
