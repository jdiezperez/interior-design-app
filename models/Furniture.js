const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Furniture = sequelize.define('Furniture', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    furnitureCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Furniture;
