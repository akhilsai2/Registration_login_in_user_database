const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userDetails = `SELECT * FROM user WHERE username='${username}';`;
  const user = await db.get(userDetails);
  if (user === undefined) {
    if (`${password}`.length >= 5) {
      const userRegister = `INSERT INTO user (username,name,password,gender,location)
        VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(userRegister);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userDetails = `SELECT * FROM user WHERE username='${username}';`;
  const userMatch = await db.get(userDetails);
  if (userMatch === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userMatch.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userDetails = `SELECT * FROM user WHERE username='${username}';`;
  const userMatch = await db.get(userDetails);
  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    userMatch.password
  );
  if (isPasswordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (`${newPassword}`.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = `Update user SET password='${hashedPassword}' WHERE username='${username}' ;`;
      await db.run(updatePassword);
      response.send("Password updated");
    }
  }
});

module.exports = app;
