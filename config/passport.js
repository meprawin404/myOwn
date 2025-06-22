const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/model.user");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/user/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    // Find or create user logic
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = await User.create({
        fullName: profile.displayName,
        email: profile.emails[0].value,
        profileImageUrl: profile.photos[0].value,
        password: randomBytes(16).toString(), // random password
      });
    }
    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;