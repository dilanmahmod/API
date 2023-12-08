// Här importerar jag express-modulen och skapar en express-app
let express = require("express");
let app = express();
//Här lyssnar den på port 9000
app.listen(9000);
console.log("Servern körs på port 9000");

//GET-route för rotvägen "/"
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/dokumentation.html");
});

// Importera mysql-modulen
const mysql = require("mysql");

// Här skapas en anslutning till MySQL-databasen med dessa inställningar
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "jensen2023",
  multipleStatements: true,
});

// Använd express middleware för att tolka JSON-data i inkommande förfrågningar
app.use(express.json());

// En konstant som definierar kolumnnamnen i en användartabell
const COLUMNS = ["id", "username", "password", "name", "email"];

// En GET-routefunktion som hämtar användare från en databas
app.get("/users", (req, res) => {
  let sql = "SELECT * FROM users";
  let condition = createCondition(req.query);
  con.query(sql + condition, (err, result, fields) => {
    if (err) {
      console.error("Fel vid databasförfrågan:", err);
      return res.status(500).send("Ett fel uppstod vid hämtning av användare");
    }
    res.send(result);
  });
});

// Funktion för att skapa en villkorssats baserat på query-parametrar
const createCondition = (query) => {
  let output = " WHERE ";
  for (let key in query) {
    if (COLUMNS.includes(key)) {
      output += `${key}=${con.escape(query[key])} AND `;
    }
  }
  return output.length === 7 ? "" : output.slice(0, -5);
};

// GET-routefunktion för att hämta en användare baserat på ID
app.get("/users/:id", (req, res) => {
  let sql = "SELECT * FROM users WHERE id=" + con.escape(req.params.id);
  con.query(sql, (err, result, fields) => {
    if (err) {
      console.error("Fel vid databasförfrågan:", err);
      return res.status(500).send("Ett fel uppstod vid hämtning av användare");
    }
    if (result.length > 0) {
      res.send(result);
    } else {
      res.sendStatus(401); // 404=not found
    }
  });
});

// POST-routefunktion för att skapa en ny användare
app.post("/users", function (req, res) {
  if (!req.body.username) {
    res.status(400).send("username required!");
    return; // avslutar 
  }
  let fields = ["username", "password", "name", "email"]; 
  for (let key in req.body) {
    if (!fields.includes(key)) {
      res.status(400).send("Unknown field: " + key);
      return; // avslutar
    }
  }
  // Kod för att hantera anropet och sätta in användarinformation i databasen
  let sql = `INSERT INTO users (username, password, name, email)
    VALUES ('${req.body.username}', 
    '${req.body.password}',
    '${req.body.name}',
    '${req.body.email}');
    SELECT LAST_INSERT_ID();`; // Innehåller två query: ett insert samt ett select
  console.log(sql);

  // Utför SQL-frågan mot databasen
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    // kod för att hantera retur av data
    console.log(result);
    let output = {
      id: result[0].insertId,
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      email: req.body.email,
    };
    res.send(output);
  });
});
