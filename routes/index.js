var express = require('express');
const LoremIpsum = require("lorem-ipsum").LoremIpsum;
var schedule = require('node-schedule');
var uuid = require('node-uuid');
var sqlite3 = require('sqlite3').verbose();
const NodeCache = require("node-cache");
var router = express.Router();
var useragent = require('express-useragent');
const rateLimit = require("express-rate-limit");

const dotenv = require('dotenv');
dotenv.config();
console.log(`Your port is ${process.env.PORT}`); // 8626
console.log(`Your domain is ${process.env.DOMAIN}`); // 8626
console.log(`Your Node environment is ${process.env.NODE_ENV}`); // 8626


router.use(useragent.express());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  headers: true,
  handler: function (req, res) {
    visitorLog(req, '.', '.', true);
    res.status(429).send("too many requests");
  }
});
router.use(apiLimiter);

const myCache = new NodeCache();
var db = new sqlite3.Database('./db/generated_URLs.db');
db.run("CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT, content TEXT)");
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

var glob = require("glob")
var imageList = [];

glob("**/*.jpg", function (er, files) {
  files.forEach(file => {
    imageList.push(file.split("/")[2]);
  });
  success = myCache.set("imageList", imageList);
})

// TODO set a proper schedule (once or a week for example)
var rule = process.env.GEN_SCHEDULE_PROD
if (process.env.NODE_ENV == "development")
  rule = process.env.GEN_SCHEDULE_DEV
var j = schedule.scheduleJob(rule, function () {
  var content = lorem.generateParagraphs(1);
  const latest = { url: uuid.v4(), content: content };
  console.log('\x1b[36m%s\x1b[0m', 'CRON job caching', latest.url);
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT, content TEXT)");
    db.run("INSERT INTO URL(_id, url, content) VALUES (?,?,?)", [latest.url, latest.url, latest.content], function (err) {
      if (err) {
        return console.log(err.message);
      }
      // Get the last insert id
      console.log('\x1b[36m%s\x1b[0m', `A row has been inserted with rowid ${this.lastID}`);
      success = myCache.set("latest", latest);
    });
  });
});

var dns = require('dns');
var visitor_type = {
  0: 'Search Engine Bot',
  1: 'Suspicious',
  2: 'Harvester',
  3: 'Suspicious, Harvester',
  4: 'Comment Spammer',
  5: 'Suspicious, Comment Spammer',
  6: 'Harvester, Comment Spammer',
  7: 'Suspicious, Harvester, Comment Spammer'
};
router.use(function (req, res, next) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip.substr(0, 7) == "::ffff:") {
    ip = ip.substr(7)
  }
  if (process.env.NODE_ENV == "development" || ip.split('.')[0] == "127")
    next();
  var reversed_ip = ip.split('.').reverse().join('.');
  dns.resolve4([process.env.HONEYPOT_KEY, reversed_ip, 'dnsbl.httpbl.org'].join('.'), function (err, addresses) {
    var _response = addresses.toString().split('.').map(Number);
    var test = (_response[0] === 127 && _response[3] > 0) //visitor_type[_response[3]]
    if (test)
      res.send({ msg: 'we hate spam to begin with!' }); 
    next();
  });
});

/* GET home page. */
router.get('/', function (req, res, next) {
  visitorLog(req, 'index', 'index', false);
  db.all(`SELECT _id, timestamp, url, content FROM URL ORDER BY date(_id)`, [], (err, rows) => {
    if (err) {
      console.log(err.message);
      throw err;
    }
    res.render('index', {
      title: 'Secluded',
      message: 'Secluded is a webpage that tries to be isolated from web crawlers although publically visible. It is a crawler behaviour experiment. It is hopefully SEO friendly in all aspects except that it tells crawlers not to index itself. So linking to this domain to gain popularity is appreciated and thanked for. It is to note that bots visits is totally fine even if a page disallows indexing. Repetetive visits are suspecious and can even be annoying; Our final conclusions are derived after analysing which service indexed content really.',
      technique: 'Robots meta directives and robots.txt are pieces of code that provide crawlers instructions for how to crawl or index web page content. One hidden page is hosted. Its URL (and content) is unique and random. The latest page changes over time so that we track evolution of indexing with pages aging. Link are withing this page so that crawlers can follow.',
      urls_list: rows.reverse()
    });
  });
});

/* GET data page. */
router.get('/data', function (req, res, next) {
  res.render('data', {
    title: 'Secluded',
    message: 'We only include bots visits of course (with isBot=true). Data describe bots visits for each endpoint in a specific time. You can find in the list bellow a growing dataset with snapshots each week. It is to note that bots visits is totally fine even if a page disallows indexing. Repetetive visits are suspecious and can even be annoying; Our final conclusions are derived after analysing which service indexed content really.',
    technique: 'Data is like ("resource": "index", "timestamps": "21:20:27", "endpoint": "index", "isMobile": false, "isTablet": false, "isOpera": false, "isIE": false, "isEdge": false, "isIECompatibilityMode": false, "isSafari": false, "isFirefox": true, "isWebkit": false, "isChrome": false, "isDesktop": true, "isBot": false, "isFacebook": false, "silkAccelerated": false, "browser": "Firefox", "version": "84.0", "os": "Windows 10.0", "platform": "Microsoft Windows", "geoIp": {}, "source": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0", "isWechat": false)',
  });
});


// /* GET latest page. */
// router.get('/latest', function (req, res, next) {
//   var url = myCache.get("latest").url
//   visitorLog(req, 'latest', url, false);
//   var content = myCache.get("latest").content;
//   console.log('\x1b[33m%s\x1b[0m', "Latest found ==>  " + url)
//   res.render('earlier', {
//     title: 'Secluded',
//     content: content
//   });
// });

/* GET earlier page. */
router.get('/earlier/:id', function (req, res, next) {
  visitorLog(req, 'ealier', req.params.id, false);
  // if (myCache.has("latest") && req.params.id == myCache.get("latest").url) {
  //   console.log("Found again ==>  " + req.params.id);
  //   var content = myCache.get("latest").content;
  //   res.send(content);
  // } else {
  db.serialize(function () {
    let sql = `SELECT rowid, _id, timestamp, url, content FROM URL WHERE _id = ?`;
    let url = req.params.id;
    db.get(sql, [url], (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      if (row) {
        res.render('earlier', {
          title: 'Secluded',
          content: row.content,
          picURL: imageList[row.rowid % 30]
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
  // }
});

const { SitemapStream, streamToPromise } = require('sitemap')
const { createGzip } = require('zlib')

let sitemap
/* GET sitemap.xml page. */
router.get('/sitemap.xml', function (req, res) {
  db.all(`SELECT _id, timestamp, url, content FROM URL ORDER BY date(_id)`, [], (err, rows) => {
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');
    // if we have a cached entry send it
    if (sitemap) {
      res.send(sitemap)
      return
    }
    try {
      const smStream = new SitemapStream({ hostname: `${process.env.DOMAIN}` })
      // FIXME: change origin 
      const pipeline = smStream.pipe(createGzip())
      rows.forEach(row => {
        smStream.write({ url: `earlier/${row.url}/`, changefreq: 'monthly', priority: 0.1 });
      })
      // cache the response
      streamToPromise(pipeline).then(sm => sitemap = sm)
      // make sure to attach a write stream such as streamToPromise before ending
      smStream.end()
      // stream write the response
      pipeline.pipe(res).on('error', (e) => { throw e })
    } catch (e) {
      console.error(e)
      res.status(500).end()
    }
  });
})

router.get('/robots.txt', function (req, res) {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /$\nDisallow: /\nSitemap: ${process.env.DOMAIN}/sitemap.xml`);
});

const low = require('lowdb');
const zlib = require('zlib');

const compress = {
  serialize: (obj) => zlib.gzipSync(JSON.stringify(obj), { level: 9 }),
  deserialize: (str) => JSON.parse(zlib.gunzipSync(str), { level: 9 })
}
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('./db/visitors.json', { format: compress });
const db2 = low(adapter);
db2.defaults({ useragents: [] }).write();
var moment = require('moment')
const BotDetector = require("device-detector-js/dist/parsers/bot")
const isbot = require('isbot')
function visitorLog(req, endpoint, id, critical) {
  // Object to be cached is: req.useragent
  // Just picking some keys.
  var timestamps = moment().format('HH:mm:ss')
  var requestInfo = {
    "resource": id,
    "timestamps": timestamps,
    "endpoint": endpoint,
    "isMobile": req.useragent.isMobile,
    "isTablet": req.useragent.isTablet,
    "isOpera": req.useragent.isOpera,
    "isIE": req.useragent.isIE,
    "isEdge": req.useragent.isEdge,
    "isIECompatibilityMode": req.useragent.isIECompatibilityMode,
    "isSafari": req.useragent.isSafari,
    "isFirefox": req.useragent.isFirefox,
    "isWebkit": req.useragent.isWebkit,
    "isChrome": req.useragent.isChrome,
    "isDesktop": req.useragent.isDesktop,
    "isBot": req.useragent.isBot,
    "isFacebook": req.useragent.isFacebook,
    "silkAccelerated": req.useragent.silkAccelerated,
    "browser": req.useragent.browser,
    "version": req.useragent.version,
    "os": req.useragent.os,
    "platform": req.useragent.platform,
    "geoIp": req.useragent.geoIp,
    "source": req.useragent.source,
    "isWechat": req.useragent.isWechat,
    "critical": critical
  }
  // Detect bot and adding information to requestInfo
  if (req.useragent.isBot || isbot(req.get('user-agent'))) {
    const botDetector = new BotDetector();
    const userAgent = req.useragent.source;
    const bot = botDetector.parse(userAgent);
    requestInfo["botInfo"] = bot
    db2.get('useragents')
      .push(requestInfo)
      .write();
  } else if (process.env.NODE_ENV == 'development') {
    db2.get('useragents')
      .push(requestInfo)
      .write();
  }
}

// FIXME Cntl-c exit (and others ?) does not exit properly
process.on('SIGINT', () => {
  j.cancel();
  db.close();
  // server.close();
});

module.exports = router;
