var express = require('express');
var router = express.Router();

const LoremIpsum = require("lorem-ipsum").LoremIpsum;
var schedule = require('node-schedule');
var uuid = require('node-uuid');
var sqlite3 = require('sqlite3').verbose();
const NodeCache = require("node-cache");
const myCache = new NodeCache();
var db = new sqlite3.Database('./db/secluded0.db');
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
var j = schedule.scheduleJob("*/5 * * * *", function () {
  var content = lorem.generateParagraphs(1);
  const latest = { url: uuid.v4(), content: content };
  console.log('\x1b[36m%s\x1b[0m', 'CRON job caching', latest.url);
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT, content TEXT)");
    db.run("INSERT INTO URL(_id, url, content) VALUES (?,?,?)", [latest.url, latest.url, latest.content], function (err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log('\x1b[36m%s\x1b[0m', `A row has been inserted with rowid ${this.lastID}`);
      success = myCache.set("latest", latest);
    });
    // db.all(`SELECT _id, timestamp, url FROM URL ORDER BY _id`, [], (err, rows) => {
    //   if (err) {
    //     console.log(err.message);
    //     throw err;
    //   }
    //   rows.forEach((row) => {
    //     console.log(row);
    //   });
    // });
  });
});

/* GET home page. */
router.get('/', function (req, res, next) {

  if (myCache.has("latest")) {

  }
  res.render('index', {
    title: 'Secluded',
    message: 'Secluded is a webpage that tries to be isolated from web crawlers although publically visible. It is a crawler behaviour experiment. It is hopefully SEO friendly in all aspects except that it tells crawlers not to index itself. So linking to this domain to gain popularity is appreciated and thanked for.',
    technique: 'Robots meta directives and robots.txt are pieces of code that provide crawlers instructions for how to crawl or index web page content. One hidden page is hosted. Its URL (and content) is unique and random. The latest page changes over time so that we track evolution of indexing with pages aging. Link are withing this page so that crawlers can follow.'
  });
});

/* GET home page. */
router.get('/latest', function (req, res, next) {
  var url = myCache.get("latest").url
  var content = myCache.get("latest").content;
  console.log('\x1b[33m%s\x1b[0m', "Latest found ==>  " + url)
  res.send(content);
});

/* GET home page. */
router.get('/earlier/:id', function (req, res, next) {
  if (myCache.has("latest") && req.params.id == myCache.get("latest").url) {
    console.log("Found again ==>  " + req.params.id);
    var content = myCache.get("latest").content;
    res.send(content);
  } else {
    let db = new sqlite3.Database('./db/secluded0.db', (err) => {
      if (err) {
        return console.error(err.message);
      }
      let sql = `SELECT _id, timestamp, url, content FROM URL WHERE _id = ?`;
      let url = req.params.id;
      db.get(sql, [url], (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        if (row) {
          res.render('earlier', {
            title: 'Secluded',
            content: row.content
          });
        } else {
          console.log('\x1b[31m', `No URL found with the id: ${url}`);
          res.status(404).render('404', {
            title: 'Secluded',
            error_message: `No URL found with the id: ${url}`
          });
        }
      });
    });
  }
});

process.on('SIGINT', () => {
  j.cancel();
  db.close();
  // server.close();
});

module.exports = router;
