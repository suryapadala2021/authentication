const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUser = `
    SELECT
    *
    FROM
    user
    WHERE
    username='${username}';`;
  const dbUser = await db.get(getUser);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashPass = await bcrypt.hash(password, 10);
    const addUser = `
        INSERT INTO
        user(username,name,password,gender,location)
        VALUES('${username}','${name}','${hashPass}','${gender}','${location}');`;
    await db.run(addUser);
    response.send("User created successfully");
  }
});
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `
    SELECT
    *
    FROM
    user
    WHERE
    username='${username}';`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else if (await bcrypt.compare(password, dbUser.password)) {
    response.send("Login success!");
  } else {
    response.status(400);
    response.send("Invalid password");
  }
});
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `
    SELECT
    *
    FROM
    user
    WHERE
    username='${username}';`;
  const dbUser = await db.get(getUser);
  const isOldPassCrt = await bcrypt.compare(oldPassword, dbUser.password);
  if (isOldPassCrt === false) {
    response.status(400);
    response.send("Invalid current password");
  } else if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashPass = await bcrypt.hash(newPassword, 10);
    const updatePass = `
        UPDATE
        user
        SET
        password='${hashPass}'
        WHERE
        username='${username}';`;
    await db.run(updatePass);
    response.send("Password updated");
  }
});
