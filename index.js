const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"});

app.use(morgan("combined", {stream: accessLogStream}));
app.use(express.static("public"));

app.get("/movies", (req, res) => {
    res.sendFile("movies.json", {root: __dirname});
});

app.get("/", (req, res) => {
    res.send("Welcome to the movie database");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

app.listen(8080, () => {
    console.log("App running on port 8080");
});