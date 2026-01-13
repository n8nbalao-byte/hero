const { Model, DataTypes } = require('sequelize');

class Product extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      descricao: DataTypes.TEXT,
      preco: DataTypes.DECIMAL(10, 2),
      categoria: DataTypes.STRING,
      imagem_url: DataTypes.TEXT,
      estoque: DataTypes.INTEGER,
      fornecedor: DataTypes.STRING,
      link_original: DataTypes.TEXT,
    }, {
      sequelize,
      tableName: 'produtos',
      timestamps: false
    });
  }

  static associate(models) {
    this.belongsTo(models.Store, { foreignKey: 'loja_id', as: 'store' });
  }
}

module.exports = Product;
