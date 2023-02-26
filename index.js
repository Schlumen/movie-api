const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");

const Movies = Models.Movie;
const Users = Models.User;

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), { flags: "a" });

// Connect to the mongodb database
// mongoose.connect("mongodb://127.0.0.1:27017/myFlixDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Turn on logging
app.use(morgan("combined", { stream: accessLogStream }));
// Direct requests to public folder
app.use(express.static("public"));
// Turn on body-parser to read JSON from req-body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use Cross-Origin Resource Sharing
const cors = require("cors");
app.use(cors());

// Require passport module and import auth.js and passport.js
let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

// READ landing page welcome message
app.get("/", (req, res) => {
    res.send("Welcome to the movie database!");
});

// READ all users (not documented yet)
app.get("/users", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.find().then(users => {
        res.status(200).json(users);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

// READ a user by username (not documented yet)
app.get("/users/:username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOne({ username: req.params.username }).then(user => {
        res.status(200).json(user);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

// READ all movies
app.get("/movies", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.find().then(movies => {
        res.status(200).json(movies);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

// READ a specific movie
app.get("/movies/:title", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ title: req.params.title }).then(movie => {
        res.status(200).json(movie);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

// READ a genre
app.get("/movies/genre/:genreName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "genre.name": req.params.genreName }).then(movie => {
        res.status(200).json(movie.genre);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

// READ a director
app.get("/movies/director/:directorName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "director.name": req.params.directorName }).then(movie => {
        res.status(200).json(movie.director);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

// CREATE a new user
app.post("/users", [
    check("username", "username is required").isLength({ min: 5 }),
    check("username", "username contains non alphanumeric characters").isAlphanumeric(),
    check("password", "password is required").not().isEmpty(),
    check("email", "email does not appear to be valid").isEmail()
], (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password);
    Users.findOne({ username: req.body.username }).then(user => {
        if (user) {
            return res.status(400).send(req.body.username + " already exists");
        } else {
            Users.create({
                username: req.body.username,
                password: hashedPassword,
                email: req.body.email,
                birthdate: req.body.birthdate
            }).then(user => {
                res.status(201).json(user);
            }).catch(error => {
                console.error(error);
                res.status(500).send("Error: " + error);
            });
        }
    }).catch(error => {
        console.error(error);
        res.status(500).send("Error: " + error);
    });
});

// UPDATE a users info by username
app.put("/users/:username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate({ username: req.params.username }, {
        $set: {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            birthdate: req.body.birthdate
        }
    }, { new: true }, (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// CREATE a new favorite movie
app.post("/users/:username/movies/:movieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate({ username: req.params.username }, {
        $push: { favoriteMovies: req.params.movieID } 
    }, { new: true }, (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// DELETE a favorite movie
app.delete("/users/:username/movies/:movieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate({ username: req.params.username }, {
        $pull: { favoriteMovies: req.params.movieID } 
    }, { new: true }, (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// DELETE a user
app.delete("/users/:username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndRemove({ username: req.params.username }).then(user => {
        if (!user) {
            res.status(400).send(req.params.username + " was not found");
        } else {
            res.status(200).send(req.params.username + " was deleted");
        }
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log("Listening on port " + port);
});