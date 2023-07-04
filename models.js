const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * Movie Schema to save movie data
 */

let movieSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    genre: {
        name: String,
        description: String
    },
    director: {
        name: String,
        bio: String,
        birthyear: Date,
        deathyear: Date
    },
    actors: [String],
    year: Number,
    imageurl: String,
    featured: Boolean
});

/**
 * User Schema to save user data
 */

let userSchema = mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    birthdate: Date,
    favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }]
});

userSchema.statics.hashPassword = password => bcrypt.hashSync(password, 10);
userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;