const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"});

// Turn on logging
app.use(morgan("combined", {stream: accessLogStream}));
// Direct requests to public folder
app.use(express.static("public"));

let movies = JSON.parse(fs.readFileSync("movies.json"));

// READ landing page welcome message
app.get("/", (req, res) => {
    res.send("Welcome to the movie database");
});

// READ all movies
app.get("/movies", (req, res) => {
    res.status(200).json(movies);
});

// READ a specific movie
app.get("/movies/:title", (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title);
    movie ? res.status(200).send(movie) : res.status(400).send("Movie not found!");
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start server and listen on port 8080
app.listen(8080, () => {
    console.log("App running on port 8080");
});