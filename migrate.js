const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    // Create Users table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        googleId TEXT,
        resetToken TEXT,
        resetTokenExpiry INTEGER,
        parentId INTEGER,
        location TEXT,
        role TEXT DEFAULT 'main_user',
        credits REAL DEFAULT 0,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    // Add columns if they don't exist (for existing databases)
    const columnsToAdd = [
        "ALTER TABLE Users ADD COLUMN parentId INTEGER;",
        "ALTER TABLE Users ADD COLUMN location VARCHAR(255);",
        "ALTER TABLE Users ADD COLUMN role VARCHAR(255) DEFAULT 'main_user';",
        "ALTER TABLE Users ADD COLUMN credits REAL DEFAULT 0;"
    ];

    columnsToAdd.forEach(query => {
        db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error adding column: ${query}`, err);
            }
        });
    });

    // Create Locations table
    db.run(`CREATE TABLE IF NOT EXISTS Locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        userId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    // Create StyleCategories table
    db.run(`CREATE TABLE IF NOT EXISTS StyleCategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        userId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    // Create FurnitureCategories table
    db.run(`CREATE TABLE IF NOT EXISTS FurnitureCategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        userId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    // Create Styles table
    db.run(`CREATE TABLE IF NOT EXISTS Styles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        styleCategoryId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    // Create StyleImages table
    db.run(`CREATE TABLE IF NOT EXISTS StyleImages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        styleId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    // Create Furnitures table
    db.run(`CREATE TABLE IF NOT EXISTS Furnitures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        furnitureCategoryId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    // Create FurnitureImages table
    db.run(`CREATE TABLE IF NOT EXISTS FurnitureImages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        furnitureId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME
    )`);

    console.log('Migration completed');
});

db.close();
