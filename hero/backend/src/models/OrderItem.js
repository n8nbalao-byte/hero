const { Model, DataTypes } = require('sequelize');

class OrderItem extends Model {
  static init(sequelize) {
    super.init({
      quantidade: DataTypes.INTEGER,
      preco_momento: DataTypes.DECIMAL(10, 2),
    }, {
      sequelize,
      tableName: 'itens_pedido',
      timestamps: false
    });
  }

  static associate(models) {
    this.belongsTo(models.Order, { foreignKey: 'pedido_id', as: 'order' });
    this.belongsTo(models.Product, { foreignKey: 'produto_id', as: 'product' });
  }
}

module.exports = OrderItem;
