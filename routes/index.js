var express = require('express');
var router = express.Router();
var uuid = require('node-uuid');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

/* GET home page. */
router.get('/', function (req, res, next) {

  const latest = uuid.v4();
  const lastes_ = { latest: latest };
  console.log(latest);
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT)");
    db.run("INSERT INTO URL(_id, url) VALUES (?,?)", [latest, latest], function (err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`);
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
  

  res.render('index', {
    title: 'Secluded',
    message: 'Secluded is a webpage that tries to be isolated from web crawers although publically visible. It is a crawler behaviour experiment. Robots meta directives and robots.txt are pieces of code that provide crawlers instructions for how to crawl or index web page content.',
    technique: 'One hidden page is hosted. Its URL is unique and random so that no one can. It also changes over time so that we track evolution of indexing over time. Its link is withing this page so that crawlers can follow, but hopefully other websites cannot directly link to. (although they technically can just like crawlers).'
  });
});

module.exports = router;
