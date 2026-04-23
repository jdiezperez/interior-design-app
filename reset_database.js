const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

try {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('✓ Database file deleted successfully');
        console.log('✓ Run "npm run start" to recreate the database with the correct schema');
    } else {
        console.log('ℹ Database file does not exist');
    }
} catch (error) {
    console.error('✗ Error deleting database file:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. The server is stopped (Ctrl+C)');
    console.log('2. No other process is using the database file');
}
