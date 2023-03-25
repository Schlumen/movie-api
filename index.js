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
mongoose.connect("mongodb://127.0.0.1:27017/myFlixDB", { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

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
    check("username", "username needs to have at least 5 characters").isLength({ min: 5 }),
    check("username", "username contains non alphanumeric characters").isAlphanumeric(),
    check("password", "password is required").not().isEmpty(),
    check("password", "password needs to have at least 8 characters").isLength({ min: 8 }),
    check("email", "email does not appear to be valid").isEmail(),
    check("birthdate", "birthdate must be a date").isDate()
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

// CREATE a movie (not documented)

app.post('/movies', (req, res) => {
    // Convert comma-separated actors string into array
    const actors = Array.isArray(req.body.actors) ? req.body.actors : req.body.actors.split(',');

    // Convert featured
    const featured = req.body.featured === "on" ? true : false;
  
    // Create new movie object with input data
    const newMovie = new Movies({
      title: req.body.title,
      description: req.body.description,
      genre: {
        name: req.body.genrename,
        description: req.body.genredescription
      },
      director: {
        name: req.body.directorname,
        bio: req.body.directorbio,
        birthyear: req.body.directorbirthyear,
        deathyear: req.body.directordeathyear
      },
      actors: actors,
      year: req.body.year,
      imageurl: req.body.imageurl,
      featured: featured
    });
  
    // Save new movie object to MongoDB
    newMovie.save((err, movie) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error adding movie to database');
      } else {
        res.status(201).send(movie);
      }
    });
  });

// UPDATE a users info by username
app.put("/users/:oldusername", [
    check("username", "username needs to have at least 5 characters").isLength({ min: 5 }),
    check("username", "username contains non alphanumeric characters").isAlphanumeric(),
    check("password", "password is required").not().isEmpty(),
    check("password", "password needs to have at least 8 characters").isLength({ min: 8 }),
    check("email", "email does not appear to be valid").isEmail(),
    check("birthdate", "birthdate must be a date").isDate()
], passport.authenticate("jwt", { session: false }), (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    function updateUser() {
        let hashedPassword = Users.hashPassword(req.body.password);
        Users.findOneAndUpdate({ username: req.params.oldusername }, {
            $set: {
                username: req.body.username,
                password: hashedPassword,
                email: req.body.email,
                birthdate: req.body.birthdate
            }
        }, { new: true }, (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error: " + err);
            } else {
                res.status(200).json(updatedUser);
            }
        });
    }

    //Check if user is authorized
    if (req.params.oldusername === req.user.username) {
        //Check in case the user gives a new username if the new username already exists
        if (req.body.username !== req.user.username) {
            Users.findOne({ username: req.body.username }).then(user => {
                if (user) {
                    return res.status(400).send(req.body.username + " already exists");
                } else {
                    updateUser();
                }
            });
        } else {
            updateUser();
        }
    } else {
        res.status(500).send("Unauthorized");
    }

    
});

// CREATE a new favorite movie
app.post("/users/:username/movies/:movieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    //Check if user is authorized
    if (req.params.username === req.user.username) {
        Users.findOneAndUpdate({ username: req.params.username }, {
            $push: { favoriteMovies: req.params.movieID } 
        }, { new: true }, (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error: " + err);
            } else {
                res.status(200).json(updatedUser);
            }
        });
    } else {
        res.status(500).send("Unauthorized");
    }
});

// DELETE a favorite movie
app.delete("/users/:username/movies/:movieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    //Check if user is authorized
    if (req.params.username === req.user.username) {
        Users.findOneAndUpdate({ username: req.params.username }, {
            $pull: { favoriteMovies: req.params.movieID } 
        }, { new: true }, (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error: " + err);
            } else {
                res.status(200).json(updatedUser);
            }
        });

    } else {
        res.status(500).send("Unauthorized");
    }
});

// DELETE a user
app.delete("/users/:username", passport.authenticate("jwt", { session: false }), (req, res) => {
    //Check if user is authorized
    if (req.params.username === req.user.username) {
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
    } else {
        res.status(500).send("Unauthorized");
    }
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