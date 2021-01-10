var express = require('express');
var router = express.Router();

const LoremIpsum = require("lorem-ipsum").LoremIpsum;
var schedule = require('node-schedule');
var uuid = require('node-uuid');
var sqlite3 = require('sqlite3').verbose();
const NodeCache = require("node-cache");
const myCache = new NodeCache();
var db = new sqlite3.Database('./db/secluded.db');
var rule = new schedule.RecurrenceRule();
rule.minute = 0;
rule.hour = 0;
success = myCache.set("latest", uuid.v4());
const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});
var j = schedule.scheduleJob(rule, function () {
  const latest = { url: uuid.v4(), content: content };
  console.log(latest.url);
  var content = lorem.generateParagraphs(1);
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT, content TEXT)");
    db.run("INSERT INTO URL(_id, url, content) VALUES (?,?,?)", [latest.url, latest.url, latest.content], function (err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`);
      success = myCache.set("latest", latest);
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
});

/* GET home page. */
router.get('/', function (req, res, next) {

  if (myCache.has("latest")) {

  }
  res.render('index', {
    title: 'Secluded',
    message: 'Secluded is a webpage that tries to be isolated from web crawers although publically visible. It is a crawler behaviour experiment. Robots meta directives and robots.txt are pieces of code that provide crawlers instructions for how to crawl or index web page content.',
    technique: 'One hidden page is hosted. Its URL is unique and random so that no one can. It also changes over time so that we track evolution of indexing over time. Its link is withing this page so that crawlers can follow, but hopefully other websites cannot directly link to. (although they technically can just like crawlers).'
  });
});

/* GET home page. */
router.get('/latest', function (req, res, next) {
  var url = myCache.get("latest").url
  var content = myCache.get("latest").content;
  console.log("latest found: " + url)
  res.send(content);
});

/* GET home page. */
router.get('/earlier/:id', function (req, res, next) {
  if (myCache.has("latest") && req.params.id == myCache.get("latest").url) {
    console.log("wow it is found again " + req.params.id)
    var url = myCache.get("latest").url;
    var content = myCache.get("latest").content;
    res.send(content);
  } else {
    let db = new sqlite3.Database('./db/secluded.db', (err) => {
      if (err) {
        return console.error(err.message);
      }
      let sql = `SELECT _id, timestamp, url FROM URL WHERE _id = ?`;
      let url = req.params.id;
      db.get(sql, [url], (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        row ? console.log(row.id, row.timestamp, row.url) : console.log(`No URL found with the id ${url}`);

      });
      console.log('Connected to the in-memory SQlite database.');
    });
  }
});

process.on('SIGINT', () => {
  db.close();
  server.close();
});

module.exports = router;
