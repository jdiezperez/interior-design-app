const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Style = sequelize.define('Style', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    styleCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Style;
