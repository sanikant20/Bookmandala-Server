import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:8000/auth/google/callback",
  passReqToCallback: true
},
  function (request, accessToken, refreshToken, profile, done) {
    done(null, profile);
  }
));

// Serialize and Deserialize
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

