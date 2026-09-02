const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/laragon/www/pontage/backend/elysium.db');

db.all("SELECT id, name, created_at, subsite_id FROM agents WHERE name LIKE '%dddd%'", (err, rows) => {
    if (err) throw err;
    console.log("Agents:", rows);
});
db.close();
