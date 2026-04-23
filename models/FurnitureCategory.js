const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FurnitureCategory = sequelize.define('FurnitureCategory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false // Linked to the main user who created it
    }
});

module.exports = FurnitureCategory;