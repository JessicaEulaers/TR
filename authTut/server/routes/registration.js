const express = require('express');
var app = express();

app.get('/registration', (req, res) => {
    res.render('registration.ejs',{})
  })