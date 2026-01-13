const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      senha: {
        type: DataTypes.STRING,
      },
      tipo: {
        type: DataTypes.STRING, // client, courier, shop_owner, admin
        defaultValue: 'client'
      },
      telefone: DataTypes.STRING,
      whatsapp: DataTypes.STRING,
      veiculo_tipo: DataTypes.STRING,
      veiculo_placa: DataTypes.STRING,
      online: DataTypes.BOOLEAN,
      latitude_atual: DataTypes.DECIMAL(10, 8),
      longitude_atual: DataTypes.DECIMAL(11, 8),
      avatar_url: DataTypes.STRING,
      data_nascimento: DataTypes.DATEONLY,
      google_id: DataTypes.STRING,
      cnh_url: DataTypes.STRING,
      document_url: DataTypes.STRING,
    }, {
      sequelize,
      tableName: 'usuarios',
      createdAt: 'criado_em',
      updatedAt: false // Schema doesn't have updated_at
    });
  }

  static associate(models) {
    this.hasMany(models.Order, { foreignKey: 'cliente_id', as: 'client_orders' });
    this.hasMany(models.Order, { foreignKey: 'motoboy_id', as: 'courier_orders' });
    this.hasOne(models.Store, { foreignKey: 'usuario_id', as: 'store' });
  }

  checkPassword(password) {
    if (!this.senha) return false;
    return bcrypt.compare(password, this.senha);
  }
}

module.exports = User;
