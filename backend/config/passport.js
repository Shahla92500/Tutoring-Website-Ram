const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

const hasGitHubConfig =
	process.env.GITHUB_CLIENT_ID &&
	process.env.GITHUB_CLIENT_SECRET &&
	process.env.GITHUB_CALLBACK_URL;

const hasGoogleConfig =
	process.env.GOOGLE_CLIENT_ID &&
	process.env.GOOGLE_CLIENT_SECRET &&
	process.env.GOOGLE_CALLBACK_URL;

if (hasGitHubConfig) {
	passport.use(
		new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				callbackURL: process.env.GITHUB_CALLBACK_URL,
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			// This is the "verify" callback
			async (req, accessToken, refreshToken, profile, done) => {
				// console.log("This is the profile: \t\n", profile);
				try {
					// Read the role from the OAuth state
					const state = JSON.parse(req.query.state);
					const roleFromFrontend = state.role;

					// The "profile" object contains the user's GitHub information
					const existingUser = await User.findOne({ githubId: profile.id });

					if (existingUser) {
						// If user already exists, pass them to the next middleware
						return done(null, existingUser);
					}

					// Validate the role
					if (["learner", "alumni"].indexOf(roleFromFrontend) === -1) {
						return done(new Error("Invalid role"), null);
					}

					// If it's a new user, create a record in our database
					const newUser = new User({
						githubId: profile.id,
						username: profile.username,
						email: profile.emails ? profile.emails[0].value : "test@mail.com", // Some providers return an array of emails
						password: Math.random().toString(36).slice(-8), //random password generator
						role: roleFromFrontend || "learner", //default role is learner
					});

					// console.log("newUser profile: \t\n", newUser);

					await newUser.save();
					done(null, newUser);
				} catch (err) {
					done(err);
				}
			},
		),
	);
} else {
	console.warn("GitHub OAuth is disabled because GitHub environment variables are not configured.");
}

//google

if (hasGoogleConfig) {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: process.env.GOOGLE_CALLBACK_URL,
				passReqToCallback: true,
			},
			async (req, accessToken, refreshToken, profile, done) => {
				try {
					// Read the role from the OAuth state
					const state = JSON.parse(req.query.state);
					const roleFromFrontend = state.role;

					let existingUser = await User.findOne({ googleId: profile.id });

					if (existingUser) {
						// If user already exists, pass them to the next middleware
						return done(null, existingUser);
					}

					// Validate the role
					if (["learner", "alumni"].indexOf(roleFromFrontend) === -1) {
						return done(new Error("Invalid role"), null);
					}

					console.log("Google profile: \t\n", profile);

					const newUser = await User.create({
						googleId: profile.id,
						username: profile.displayName,
						name: profile.displayName,
						email: profile.emails ? profile.emails[0].value : "test@mail.com",
						password: Math.random().toString(36).slice(-8), //random password generator
						role: roleFromFrontend || "learner", //default role is learner
					});

					console.log("newUser Google profile: \t\n", newUser);
					await newUser.save();
					done(null, newUser);
				} catch (err) {
					done(err, null);
				}
			},
		),
	);
} else {
	console.warn("Google OAuth is disabled because Google environment variables are not configured.");
}

// These functions are needed for session management
passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => done(err, user));
});
