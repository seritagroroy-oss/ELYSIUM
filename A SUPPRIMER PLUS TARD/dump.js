const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('C:\\laragon\\www\\pontage\\backend\\database\\pontage.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.all("SELECT id, name, json_extract(profile_data, '$.permanent_supps') as ps FROM agents WHERE json_extract(profile_data, '$.permanent_supps') IS NOT NULL AND json_extract(profile_data, '$.permanent_supps') != '[]' LIMIT 10;", [], (err, rows) => {
  if (err) {
    throw err;
  }
  fs.writeFileSync('C:\\laragon\\www\\pontage\\dump.json', JSON.stringify(rows, null, 2));
  console.log("Done");
});

db.close();
