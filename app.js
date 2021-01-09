var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var schedule = require('node-schedule');
var uuid = require('node-uuid');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
var rule = new schedule.RecurrenceRule();
rule.minute = 0;
rule.hour = 0;
 
var j = schedule.scheduleJob(rule, function(){
  console.log('The answer to life, the universe, and everything!');
  const latest = uuid.v4();
  const lastes_ = {latest: latest};
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS URL (_id TEXT primary, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT)");
    db.prepare("INSERT INTO URL(_id, url) VALUES (?,?)", [latest, latest], function(err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

  });
  
  db.close();
});

module.exports = app;
