const LoremIpsum = require("lorem-ipsum").LoremIpsum;
const rateLimit = require("express-rate-limit");

var globals = {};
globals['sqlite'] = {
  "CREATE_TABLE_IF_NOT_EXISTS": "CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT, content TEXT)",
  "INSERT_URL": "INSERT INTO URL(_id, url, content) VALUES (?,?,?)",
  "SELECT_URLS": "SELECT _id, timestamp, url, content FROM URL ORDER BY date(_id)",
  "SELECT_ONE_URL": "SELECT rowid, _id, timestamp, url, content FROM URL WHERE _id = ?"
};
// "resource", "timestamps", "endpoint", "isMobile", "isTablet", "isOpera", "isIE", "isEdge", "isIECompatibilityMode", "isSafari", "isFirefox", "isWebkit", "isChrome", "isDesktop", "isBot", "isFacebook", "silkAccelerated", "browser", "version", "os", "platform", "geoIp", "source", "isWechat", "critical", "botName", "botCategory", "botURL", "botProdName", "botProdURL"
globals['lowdb'] = {

};
// ```


// TABLESPACE pg_default;

// ALTER TABLE "STATIC_CONTENT"."URL"
//     OWNER to postgres;
// ```

// ````
// INSERT INTO "STATIC_CONTENT"."URL"(
// 	_id, url, content, "timestamp")
// 	VALUES ("000000000000000", "000000000000000", "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", CURRENT_TIMESTAMP);
// ```

// ```
// SELECT _id, url, content, "timestamp"
// 	FROM "STATIC_CONTENT"."URL";
// ```

globals['pgsql'] = {
  "CREATE_DATABASE": "CREATE DATABASE secluded WITH OWNER = postgres ENCODING = 'UTF8' LC_COLLATE = 'English_United States.1252' LC_CTYPE = 'English_United States.1252' TABLESPACE = pg_default CONNECTION LIMIT = -1;",
  "CREATE_SCHEMA": "CREATE SCHEMA 'STATIC_CONTENT' AUTHORIZATION postgres;",
  "CREATE_TABLE_IF_NOT_EXISTS": 'CREATE TABLE IF NOT EXISTS "STATIC_CONTENT"."URL" (_id text NOT NULL, "timestamp" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP, url text NOT NULL, content text COLLATE pg_catalog."default" NOT NULL, CONSTRAINT "URL_pkey" PRIMARY KEY (_id))',
  "INSERT_INTO_URL": 'INSERT INTO "STATIC_CONTENT"."URL"(_id, url, content, "timestamp") VALUES ($1, $2, $3, CURRENT_TIMESTAMP);'
};

const { Client } = require('pg')
globals['psql_client'] = new Client({
  host: 'localhost',
  database: "secluded",
  port: 5433,
  user: 'postgres',
  password: '',
})

globals['lorem'] = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});

globals['apiLimiter'] = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  headers: true,
  handler: function (req, res) {
    visitorLog(req, '.', '.', true);
    res.status(429).send("too many requests");
  }
});

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

module.exports = globals;
