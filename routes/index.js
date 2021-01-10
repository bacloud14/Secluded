var express = require('express');
var router = express.Router();

var schedule = require('node-schedule');
var uuid = require('node-uuid');
var sqlite3 = require('sqlite3').verbose();
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();
var db = new sqlite3.Database(':memory:');
var rule = new schedule.RecurrenceRule();
rule.minute = 0;
rule.hour = 0;
success = myCache.set( "latest",  uuid.v4() );
var j = schedule.scheduleJob(rule, function(){
  const latest = uuid.v4();
  console.log(latest);
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT)");
    db.run("INSERT INTO URL(_id, url) VALUES (?,?)", [latest, latest], function (err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`);
      success = myCache.set( "latest", latest );
    });
    db.all(`SELECT _id, timestamp, url FROM URL ORDER BY _id`, [], (err, rows) => {
      if (err) {
        console.log(err.message);
        throw err;
      }
      rows.forEach((row) => {
        console.log(row);
      });
    });
  });
  db.close();
});


/* GET home page. */
router.get('/', function (req, res, next) {

  if(myCache.has( "latest" )){

  }
  res.render('index', {
    title: 'Secluded',
    message: 'Secluded is a webpage that tries to be isolated from web crawers although publically visible. It is a crawler behaviour experiment. Robots meta directives and robots.txt are pieces of code that provide crawlers instructions for how to crawl or index web page content.',
    technique: 'One hidden page is hosted. Its URL is unique and random so that no one can. It also changes over time so that we track evolution of indexing over time. Its link is withing this page so that crawlers can follow, but hopefully other websites cannot directly link to. (although they technically can just like crawlers).'
  });
});

/* GET home page. */
router.get('/latest', function (req, res, next) {
  console.log("latest found"+ myCache.get( "latest" ))
  myCache.get( "latest" );
  res.send("yes");
});

/* GET home page. */
router.get('/earlier/:id', function (req, res, next) {
  if(myCache.has( "latest" )){
    console.log("wow it is found again "+ req.params.id)
    res.send("yes it is the latest, enjoy")
  }else{
    // db lookup
  }
    
});

module.exports = router;
