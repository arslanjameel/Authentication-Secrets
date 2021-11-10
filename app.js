require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const md5 = require('md5');
//const encrypt=require('mongoose-encryption');

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

// use for password encrypt
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ['paassword']});

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
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    newUser.save(err => {
        if (!err) {
            res.render('Secrets');
        } else {
            console.log(err);
        }
    });
});

app.post('/login', (req, res) => {
    const email = req.body.username;
    const password = md5(req.body.password);
    User.findOne({ email: email }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render('secrets');
                } else {
                    res.render('login', { errMsg: "Email or password incorrect", username: email });
                }
            } else {
                res.render('login', { errMsg: "Email or password incorrect", username: email });
            }
        }
    });
});



app.listen(port, () => {
    console.log("server is listening on http://localhost:" + port);
});