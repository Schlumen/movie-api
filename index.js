const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"});

// Connect to the mongodb database
mongoose.connect("mongodb://localhost:27017/myFlixDB", { useNewUrlParser: true, useUnifiedTopology: true });

// Turn on logging
app.use(morgan("combined", {stream: accessLogStream}));
// Direct requests to public folder
app.use(express.static("public"));
// Turn on body-parser to read JSON from req-body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let movies = JSON.parse(fs.readFileSync("movies.json"));
let users = [
    {
        id: 1,
        name: "Jonas",
        favoriteMovies: ["Avatar", "Titanic"]
    },
    {
        id: 2,
        name: "Jason",
        favoriteMovies: ["Avengers: Infinity War", "Spider-Man: No Way Home", "Avengers: Endgame"]
    }
];

// READ landing page welcome message
app.get("/", (req, res) => {
    res.send("Welcome to the movie database!");
});

// READ all movies
app.get("/movies", (req, res) => {
    res.status(200).json(movies);
});

// READ a specific movie
app.get("/movies/:title", (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title);
    movie ? res.status(200).json(movie) : res.status(400).send("Movie not found!");
});

// READ a genre
app.get("/movies/genre/:genreName", (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.genre.name === genreName).genre;
    genre ? res.status(200).json(genre) : res.status(400).send("Genre not found!");
});

// READ a director
app.get("/movies/director/:directorName", (req, res) => {
    const { directorName } = req.params;
    const director = movies.find(movie => movie.director.name === directorName).director;
    director ? res.status(200).json(director) : res.status(400).send("Director not found!");
});

// CREATE a new user
app.post("/users", (req, res) => {
    const newUser = req.body;
    if (newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send("User needs a name!");
    }
});

// UPDATE a username
app.put("/users/:id", (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;
    let user = users.find(user => user.id == id);
    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send("No such user!");
    }
});

// CREATE a new favorite movie
app.post("/users/:id/:movieTitle", (req, res) => {
    const { id, movieTitle } = req.params;
    let user = users.find(user => user.id == id);
    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to ${user.name}'s favorites list.`);
    } else {
        res.status(400).send("No such user!");
    }
});

// DELETE a favorite movie
app.delete("/users/:id/:movieTitle", (req, res) => {
    const { id, movieTitle } = req.params;
    let user = users.find(user => user.id == id);
    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from ${user.name}'s favorites list.`);
    } else {
        res.status(400).send("No such user!");
    }
});

// DELETE a user
app.delete("/users/:id", (req, res) => {
    const { id } = req.params;
    let user = users.find(user => user.id == id);
    if (user) {
        users = users.filter(user => user.id != id);
        res.status(200).send(`User ${user.name} has been removed.`);
    } else {
        res.status(400).send("No such user!");
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start server and listen on port 8080
app.listen(8080, () => {
    console.log("Server running on port 8080");
});