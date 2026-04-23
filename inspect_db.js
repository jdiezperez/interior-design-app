const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.all("PRAGMA table_info(Users)", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Schema for Users table:');
        console.table(rows);
    });
});

db.close();
