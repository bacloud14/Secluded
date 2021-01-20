var express = require('express');
const rateLimit = require("express-rate-limit");
var CronJob = require('cron').CronJob;
var uuid = require('node-uuid');
var sqlite3 = require('sqlite3').verbose();
const NodeCache = require("node-cache");
var router = express.Router();
var useragent = require('express-useragent');
const dotenv = require('dotenv');
dotenv.config();
console.log(`Your port is ${process.env.PORT}`);
console.log(`Your domain is ${process.env.DOMAIN}`);
console.log(`Your Node environment is ${process.env.NODE_ENV}`);
console.log(`Your Cloud server is ${process.env.SERVER}`); 
var globals = require('../globals');

{
  globals.psql_client.connect(err => {
    if (err) {
      console.error('connection error', err.stack)
    } else {
      console.log('connected')
    }
  })

  globals.psql_client.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
    console.log(err ? err.stack : res.rows[0].message) // Hello World!
    // psql_client.end()
  })
}

router.use(useragent.express());
var apiLimiter = rateLimit({
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
if (process.env.CACHE!="POSTGRESQL") {
  var db = new sqlite3.Database('./db/generated_URLs.db');
  db.run(globals.sqlite.CREATE_TABLE_IF_NOT_EXISTS);
} else {
  globals.psql_client.query(globals.pgsql.CREATE_TABLE_URL_IF_NOT_EXISTS, (err, res) => {
    console.log(globals.pgsql.CREATE_TABLE_URL_IF_NOT_EXISTS)
    console.log(err ? err.stack : "new table URL created!");
  });
  globals.psql_client.query(globals.pgsql.CREATE_TABLE_USERAGENTS_IF_NOT_EXISTS, (err, res) => {
    console.log(globals.pgsql.CREATE_TABLE_USERAGENTS_IF_NOT_EXISTS)
    console.log(err ? err.stack : "new table USERAGENT created!");
  });

}

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
if (process.env.NODE_ENV == "dev")
  rule = process.env.GEN_SCHEDULE_DEV
var job = new CronJob(rule, function () {
  var content = globals.lorem.generateParagraphs(1);
  const latest = { url: uuid.v4(), content: content };
  console.log('\x1b[36m%s\x1b[0m', 'CRON job caching', latest.url);
  if (process.env.CACHE!="POSTGRESQL")
    db.serialize(function () {
      db.run(globals.sqlite.INSERT_URL, [latest.url, latest.url, latest.content], function (err) {
        if (err) {
          return console.log(err.message);
        }
        // Get the last insert id
        console.log('\x1b[36m%s\x1b[0m', `A row has been inserted with rowid ${this.lastID}`);
        success = myCache.set("latest", latest);
      });
    });
  else {
    globals.psql_client.query(globals.pgsql.INSERT_INTO_URL, [latest.url, latest.url, latest.content], (err, res) => {
      console.log(err ? err.stack : '\x1b[33m', "New URL created!");
    })
  }
}, null, false, 'America/Los_Angeles');
job.start();
var dns = require('dns');

router.use(function (req, res, next) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip.substr(0, 7) == "::ffff:") {
    ip = ip.substr(7)
  }

  if (process.env.NODE_ENV == "dev" || ip.split('.')[0] == "127")
    return next();
  var reversed_ip = ip.split('.').reverse().join('.');
  dns.resolve4([process.env.HONEYPOT_KEY, reversed_ip, 'dnsbl.httpbl.org'].join('.'), function (err, addresses) {
    if (!addresses)
      return next();
    var _response = addresses.toString().split('.').map(Number);
    var test = (_response[0] === 127 && _response[3] > 0) //visitor_type[_response[3]]
    if (test)
      res.send({ msg: 'we hate spam to begin with!' });
    return next();
  });
});

/* GET home page. */
router.get('/', function (req, res, next) {
  visitorLog(req, 'index', 'index', false);
  if (process.env.CACHE!="POSTGRESQL")
    db.all(globals.sqlite.SELECT_URLS, [], (err, rows) => {
      if (err) {
        console.log(err.message);
        throw err;
      }
      res.render('index', Object.assign(globals['index/message'], { urls_list: rows.reverse() }));
    });
  else {
    globals.psql_client.query(globals.pgsql.SELECT_ALL, (err, result) => {
      console.log(err ? err.stack : "Got all rows!");
      res.render('index', Object.assign(globals['index/message'], { urls_list: result.rows.reverse() }));
    })
  }
});

/* GET data page. */
router.get('/data', function (req, res, next) {
  res.render('data', globals['data/message']);
});

function notFound(res, url) {
  console.log('\x1b[31m', `No URL found with the id: ${url}`);
  res.status(404).render('404', {
    title: 'Secluded',
    error_message: `No URL found with the id: ${url}`
  });
}

/* GET earlier page. */
router.get('/earlier/:id', function (req, res, next) {
  visitorLog(req, 'ealier', req.params.id, false);
  let url = req.params.id;
  if (process.env.CACHE!="POSTGRESQL")
    db.serialize(function () {
      db.get(globals.sqlite.SELECT_ONE_URL, [url], (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        if (row)
          res.render('earlier', {
            title: 'Secluded',
            content: row.content,
            picURL: imageList[row.rowid % 30]
          });
        else
          notFound(res, url);
      });
    });
  else {
    globals.psql_client.query(globals.pgsql.SELECT_ONE, [url], (err, result) => {
      console.log(err ? err.stack : '\x1b[36m%s\x1b[0m', "Got that row!");
      if (result.rows) {
        var ctid = result.rows[0].ctid;
        const regexpSize = /([0-9]+),([0-9]+)/;
        const match = ctid.match(regexpSize);
        res.render('earlier', {
          title: 'Secluded',
          content: result.rows[0].content,
          picURL: imageList[parseInt(match[2]) % 30]
        });
      } else
        notFound(res, url);
    })
  }
});

const { SitemapStream, streamToPromise } = require('sitemap')
const { createGzip } = require('zlib')
let sitemap

function generateSitemap(res, rows) {
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
}

/* GET sitemap.xml page. */
router.get('/sitemap.xml', function (req, res) {
  if (process.env.CACHE!="POSTGRESQL")
    db.all(globals.sqlite.SELECT_URLS, [], (err, rows) => {
      generateSitemap(res, rows);
    });
  else
    globals.psql_client.query(globals.pgsql.SELECT_ALL, (err, result) => {
      generateSitemap(res, result.rows)
    })
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
    "source": req.useragent.source,
    "isWechat": req.useragent.isWechat,
    "critical": critical
  }
  if (process.env.CACHE=="POSTGRESQL") {
    globals.psql_client.query(globals.pgsql.INSERT_INTO_USERAGENT, [id, endpoint, req.useragent.isMobile, req.useragent.isTablet, req.useragent.isOpera, req.useragent.isIE, req.useragent.isEdge, req.useragent.isIECompatibilityMode, req.useragent.isSafari, req.useragent.isFirefox, req.useragent.isWebkit, req.useragent.isChrome, req.useragent.isDesktop, req.useragent.isBot, req.useragent.isFacebook, req.useragent.silkAccelerated, req.useragent.browser, req.useragent.version, req.useragent.os, req.useragent.platform, req.useragent.source, req.useragent.isWechat, critical], (err, res) => {
      console.log(err ? err.stack : '\x1b[33m', "New visitor created!");
    })
  } else {
    // Detect bot and adding information to requestInfo
    if (req.useragent.isBot || isbot(req.get('user-agent'))) {
      const botDetector = new BotDetector();
      const userAgent = req.useragent.source;
      const bot = botDetector.parse(userAgent);
      requestInfo["botInfo"] = bot
      db2.get('useragents')
        .push(requestInfo)
        .write();
    } else if (process.env.NODE_ENV == 'dev') {
      db2.get('useragents')
        .push(requestInfo)
        .write();
    }
  }
}

// FIXME Cntl-c exit (and others ?) does not exit properly
process.on('SIGINT', () => {
  job.stop();
  db.close();
  // server.close();
});

module.exports = router;
