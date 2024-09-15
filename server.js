const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const path = require('path');

const account = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(account),
});
const db = admin.firestore();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/signup", (req, res) => {
    res.render("signup", { error: "" });
});

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    console.log(username, email, password);
    try {
        const userRecord = await admin.auth().createUser({
            displayName: username,
            email: email,
        });
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection("users").doc(userRecord.uid).set({
            name: username,
            email: email,
            password: hashedPassword,
        });
        console.log("Successfully created user:", userRecord.uid);
        res.redirect("/");
    } catch (error) {
        const errormessage = error.errorInfo.message;
        console.error("Error creating new user:", error);
        res.render("signup", { error: errormessage });
    }
});

app.get("/signin", (req, res) => {
    res.render("signin", { error: "" });
});

app.post("/signin", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log("Successfully fetched user:", userRecord.uid);
        const userDetails = await db.collection("users").doc(userRecord.uid).get();

        if (!userDetails.exists) {
            console.log("User not found");
            return res.render("signin", { error: "User not found" });
        }
        const userData = userDetails.data();
        const storedPassword = userData.password;
        const result = await bcrypt.compare(password, storedPassword);

        if (result) {
            console.log("Login successful", userRecord.uid);
            res.redirect("/");
        } else {
            res.render("signin", { error: "Password not matched" });
        }
    } catch (error) {
        const errormessage = error?.errorInfo?.message || "An unknown error occurred";
        console.error("Error during sign-in:", error);
        res.render("signin", { error: errormessage });
    }
});

app.get("/complaint", (req, res) => {
    res.render("complaint");
});

app.post("/complaint", (req, res) => {
    const Name = req.body.Name;
    const gender = req.body.gender;
    const dept = req.body.dept;
    const text = req.body.complaint;
    console.log(Name, gender, dept, text);
    res.send("Complaint received");
});

app.listen(3000, () => {
    console.log("Server started at: 3000");
});
