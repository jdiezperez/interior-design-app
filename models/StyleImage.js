const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StyleImage = sequelize.define('StyleImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    styleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = StyleImage;
