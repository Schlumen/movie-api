const passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy,
    Models = require("./models.js"),
    passportJWT = require("passport-jwt");

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

/**
 * Log in user
 */

passport.use(new LocalStrategy({
    usernameField: "username",
    passwordField: "password"
}, (username, password, callback) => {
    console.log(username + " " + password);
    Users.findOne({ username: username }, (error, user) => {
        if (error) {
            console.log(error);
            return callback(error);
        }

        if (!user) {
            console.log("incorrect username");
            return callback(null, false, { message: "incorrect username" });
        }

        if (!user.validatePassword(password)) {
            console.log("incorrect password");
            return callback(null, false, { message: "incorrect password" })
        }

        console.log("finished");
        return callback(null, user);
    });
}));

/**
 * Check Token for any authenticated request
 */

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: "39028409qrfiwemqxoIAJMFD54gbqwmk"
}, (jwtPayload, callback) => {
    return Users.findById(jwtPayload._id).then(user => {
        return callback(null, user);
    }).catch(error => {
        return callback(error);
    });
}));