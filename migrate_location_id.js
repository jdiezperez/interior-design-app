const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Adding locationId column and migrating data...');

db.serialize(() => {
    // Add locationId column
    db.run(`ALTER TABLE Users ADD COLUMN locationId INTEGER;`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding locationId column:', err);
        } else {
            console.log('locationId column added successfully');
        }
    });

    console.log('Migration completed. Note: You need to manually update existing location data to use location IDs.');
    db.close();
});
