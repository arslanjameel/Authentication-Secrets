require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
// Connection url
const uri = 'mongodb://localhost:27017/';
// Database name
const dbName = 'userDb';
// Create a new connection
mongoose.connect(uri + dbName, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login', { errMsg: "", username: "" });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (error, hash) => {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(err => {
            if (!err) {
                res.render('Secrets');
            } else {
                console.log(err);
            }
        });
    });
});

app.post('/login', (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    User.findOne({ email: email }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result == true) {
                        res.render('secrets');
                    } else {
                        res.render('login', { errMsg: "Email or password incorrect", username: email });
                    }
                });
            } else {
                res.render('login', { errMsg: "Email or password incorrect", username: email });
            }
        }
    });
});



app.listen(port, () => {
    console.log("server is listening on http://localhost:" + port);
});