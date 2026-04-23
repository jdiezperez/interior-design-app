const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectCategory = sequelize.define('ProjectCategory', {
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
        allowNull: false
    }
});

module.exports = ProjectCategory;
