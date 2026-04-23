const User = require('../models/User');
const sequelize = require('../config/database');

async function viewUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();

        console.log('--- Registered Users ---');
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            users.forEach(user => {
                console.log(`ID: ${user.id} | Name: ${user.name} | Email: ${user.email} | GoogleID: ${user.googleId || 'None'}`);
            });
        }
        console.log('------------------------');
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await sequelize.close();
    }
}

viewUsers();
