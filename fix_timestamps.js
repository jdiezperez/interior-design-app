const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Fixing timestamp columns...');

db.serialize(() => {
    // For Users table - recreate without CURRENT_TIMESTAMP
    db.run(`
        CREATE TABLE IF NOT EXISTS Users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            googleId TEXT,
            resetToken TEXT,
            resetTokenExpiry DATETIME,
            createdAt DATETIME,
            updatedAt DATETIME,
            parentId INTEGER,
            location VARCHAR(255),
            role VARCHAR(255) DEFAULT 'main_user',
            credits FLOAT DEFAULT 0
        )
    `, (err) => {
        if (err) {
            console.error('Error creating Users_new:', err);
            return;
        }

        // Copy data
        db.run(`
            INSERT INTO Users_new 
            SELECT id, email, password, name, googleId, resetToken, resetTokenExpiry, 
                   createdAt, updatedAt, parentId, location, role, credits
            FROM Users
        `, (err) => {
            if (err) {
                console.error('Error copying Users data:', err);
                return;
            }

            // Drop old table and rename
            db.run('DROP TABLE Users', (err) => {
                if (err) {
                    console.error('Error dropping Users:', err);
                    return;
                }

                db.run('ALTER TABLE Users_new RENAME TO Users', (err) => {
                    if (err) {
                        console.error('Error renaming Users_new:', err);
                    } else {
                        console.log('Users table fixed!');
                    }
                });
            });
        });
    });

    // For Locations table
    db.run(`
        CREATE TABLE IF NOT EXISTS Locations_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            userId INTEGER NOT NULL,
            createdAt DATETIME,
            updatedAt DATETIME
        )
    `, (err) => {
        if (err) {
            console.error('Error creating Locations_new:', err);
            return;
        }

        // Copy data if exists
        db.run(`
            INSERT INTO Locations_new 
            SELECT id, name, userId, createdAt, updatedAt
            FROM Locations
        `, (err) => {
            if (err && !err.message.includes('no such table')) {
                console.error('Error copying Locations data:', err);
                return;
            }

            // Drop old table and rename
            db.run('DROP TABLE IF EXISTS Locations', (err) => {
                if (err) {
                    console.error('Error dropping Locations:', err);
                    return;
                }

                db.run('ALTER TABLE Locations_new RENAME TO Locations', (err) => {
                    if (err) {
                        console.error('Error renaming Locations_new:', err);
                    } else {
                        console.log('Locations table fixed!');
                        db.close();
                    }
                });
            });
        });
    });
});
