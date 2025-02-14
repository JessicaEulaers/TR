//npm modules
const express = require('express');
const router = express.Router();
const uuid = require('uuid').v4
const session = require('express-session')
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const axios = require('axios');
const flash  = require('connect-flash');


//--------------------------------------------------Login----------------------------------------------------------------------------

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  (email, password, done) => {
    axios.get(`http://localhost:5000/users?email=${email}`)
    .then(res => {
      const user = res.data[0]
      if (!user) {
        return done(null, false, { message: 'Invalid credentials.\n' });
      }
      if (password != user.password) {
        return done(null, false, { message: 'Invalid credentials.\n' });
      }
      return done(null, user);
    })
    .catch(error => done(error));
  }
));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  axios.get(`http://localhost:5000/users/${id}`)
  .then(res => done(null, res.data) )
  .catch(error => done(error, false))
});

// create the server
const app = express();
app.set('view engine', 'ejs');
// add & configure middleware
app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json())
app.use(session({
  genid: (req) => {
    return uuid() // use UUIDs for session IDs
  },
  store: new FileStore(),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60  } // 1 hour
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// create the homepage route at '/'
app.get('/', (req, res) => {
  res.redirect('/login')
})

// create the login get and post routes
app.get('/login', (req, res) => {
  res.render('login.ejs', {})
})

app.post('/login', (req, res, next) => {
  
  passport.authenticate('local', (err, user, info) => {
    if(info) {return res.send(info.message)}
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.login(user, (err) => {
      if (err) { return next(err); }
      return res.redirect('/authrequired');
    })
  })(req, res, next);
})

app.get('/authrequired', (req, res) => {
  if(req.isAuthenticated()) {
    res.redirect('/registration')
  } else {
    res.redirect('/')
  }
})
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login')
  
})
//-----------------------------------------------Registation------------------------------------------------------------------------------- 

app.get('/registration', (req, res) => {
  var user_id = req.user.id

  res.render('registration.ejs',{user_id: user_id })
})
app.post("/saveMorning", function(req, res){
  
  res.send('you clicked!');
})

//------------------------------------------------Users--------------------------------------------------------------------------------
app.get("/newUser", function(req, res){
  
  res.render('users.ejs',{})
})
app.get("/500",function(req, res){
  
  res.render('500.ejs',{})
})
app.post("/newUser", function(req, res){
   var id = req.body.id;
   console.log(id);
   axios.post('http://localhost:5000/users/', req.body)
   .then(res.redirect('/newUser'))
   .catch(function (error) {
        console.log(error.message);
  })
  ;
})

// FIND A user
app.post('/user/search', (req, res) => {
  //console.log(DB_URL + DB_VIEWS + 'allProducts' + '?key="' + req.body.name + '"');
  var id = req.body.id;
   console.log(id);
  axios.get('http://localhost:5000/users/'+id )
    .then(function (response) {
      console.log(response.data);
      if(response.data != null)
        res.render('resultUser.ejs', { user: response.data });
      else
        res.render('search_not_found.ejs', {})
    })
    .catch(function (error) {
      console.log(error);
    })
})

//-----------------------------------------------server-------------------------------------------------------------------------------------
// tell the server what port to listen on
app.listen(3000, () => {

  console.log('Listening on localhost:3000')
})