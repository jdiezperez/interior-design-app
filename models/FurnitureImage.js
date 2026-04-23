const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FurnitureImage = sequelize.define('FurnitureImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    furnitureId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = FurnitureImage;
