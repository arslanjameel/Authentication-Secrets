require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate');
/// using bcrypt hash password
//const bcrypt = require('bcrypt');
//const saltRounds = 10;

const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "Our little secret,",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Connection url
const uri = 'mongodb://localhost:27017/';
// Database name
const dbName = 'userDb';
// Create a new connection
mongoose.connect(uri + dbName, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret:String,
    googleId: String,
    facebookId: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        //console.log(profile.emails[0].value);

        User.findOrCreate({ googleId: profile.id, email: profile.emails[0].value }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    profileFields: ['id', 'displayName', 'photos', 'email']
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        
        User.findOrCreate({ facebookId: profile.id, email: profile.emails[0].value }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/secrets');
    } else {
        res.render('home');
    }
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    });

app.get('/auth/facebook',
    passport.authenticate('facebook',{ scope: ['email','public_profile']}));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/secrets');
    } else {
        res.render('login');
    }

});

app.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/secrets');
    } else {
        res.render('register');
    }
});

app.get('/submit',(req,res)=>{
    if (req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login');
    }
})

/// using bcrypt hash password

// app.post('/register', (req, res) => {
//     bcrypt.hash(req.body.password, saltRounds, (error, hash) => {
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });
//         newUser.save(err => {
//             if (!err) {
//                 res.render('Secrets');
//             } else {
//                 console.log(err);
//             }
//         });
//     });
// });

// app.post('/login', (req, res) => {
//     const email = req.body.username;
//     const password = req.body.password;
//     User.findOne({ email: email }, (err, foundUser) => {
//         if (err) {
//             console.log(err);
//         } else {
//             if (foundUser) {
//                 bcrypt.compare(password, foundUser.password, function (err, result) {
//                     if (result == true) {
//                         res.render('secrets');
//                     } else {
//                         res.render('login', { errMsg: "Email or password incorrect", username: email });
//                     }
//                 });
//             } else {
//                 res.render('login', { errMsg: "Email or password incorrect", username: email });
//             }
//         }
//     });
// });

// using cookies and session
app.get('/secrets', (req, res) => {
    // if (req.isAuthenticated()) {
    //     res.render('secrets');
    // } else {
    //     res.redirect('/login');
    // }
    User.find({'secret':{$ne:null}},(err,foundUsers)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render('secrets',{userSecrets:foundUsers});
            }
        }
    });
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/register', (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/register', { errMsg: "", username: email });
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });
});
//app.post("/login", passport.authenticate("local"), function(req, res){
//  res.redirect("/secrets");
//});
app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
    }));
// app.post('/login', (req, res) => {
//     const user=new User({
//         username:req.body.username,
//         password:req.body.password
//     });
//     req.login(user,(err)=>{
//         if(err){
//             console.log(err);
//         }else{
//             passport.authenticate('local')(req,res,()=>{
//                 res.redirect('/secrets');
//             });
//         }
//     })
// });

app.post('/submit',(req,res)=>{
    const submittedSecret=req.body.secret;
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save(()=>{
                    res.redirect('/secrets');
                });
            }
        }
    });
});


app.listen(port, () => {
    console.log("server is listening on http://localhost:" + port);
});