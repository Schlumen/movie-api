const jwtSecret = "39028409qrfiwemqxoIAJMFD54gbqwmk";
const jwt = require("jsonwebtoken"),
passport = require("passport");
require("./passport");

let generateJWTToken = user => {
    return jwt.sign(user, jwtSecret, {
        subject: user.username,
        expiresIn: "7d",
        algorithm: "HS256"
    });
}

module.exports = router => {
    router.post("/login", (req, res) => {
        passport.authenticate("local", { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(400).json({
                    message: "something ist not right",
                    user: user
                });
            }

            req.login(user, { session: false }, error => {
                if (error) {
                    res.send(error);
                }

                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });           
        })(req, res);
    });
}