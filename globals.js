const LoremIpsum = require("lorem-ipsum").LoremIpsum;


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
  "INSERT_INTO_URL": 'INSERT INTO "STATIC_CONTENT"."URL"(_id, url, content, "timestamp") VALUES ($1, $2, $3, CURRENT_TIMESTAMP);',
  "SELECT_ALL": 'SELECT _id, "timestamp", url, content FROM "STATIC_CONTENT"."URL" ORDER BY("timestamp")',
  "SELECT_ONE": 'SELECT ctid, _id, "timestamp", url, content FROM "STATIC_CONTENT"."URL" WHERE _id = $1'
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

globals['data/message'] = {
  title: 'Secluded',
  message: 'We only include bots visits of course (with isBot=true). Data describe bots visits for each endpoint in a specific time. You can find in the list bellow a growing dataset with snapshots each week. It is to note that bots visits is totally fine even if a page disallows indexing. Repetetive visits are suspecious and can even be annoying; Our final conclusions are derived after analysing which service indexed content really.',
  technique: 'Data is like ("resource": "index", "timestamps": "21:20:27", "endpoint": "index", "isMobile": false, "isTablet": false, "isOpera": false, "isIE": false, "isEdge": false, "isIECompatibilityMode": false, "isSafari": false, "isFirefox": true, "isWebkit": false, "isChrome": false, "isDesktop": true, "isBot": false, "isFacebook": false, "silkAccelerated": false, "browser": "Firefox", "version": "84.0", "os": "Windows 10.0", "platform": "Microsoft Windows", "geoIp": {}, "source": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0", "isWechat": false)',
}

globals['index/message'] = {
  title: 'Secluded',
  message: 'Secluded is a webpage that tries to be isolated from web crawlers although publically visible. It is a crawler behaviour experiment. It is hopefully SEO friendly in all aspects except that it tells crawlers not to index itself. So linking to this domain to gain popularity is appreciated and thanked for. It is to note that bots visits is totally fine even if a page disallows indexing. Repetetive visits are suspecious and can even be annoying; Our final conclusions are derived after analysing which service indexed content really.',
  technique: 'Robots meta directives and robots.txt are pieces of code that provide crawlers instructions for how to crawl or index web page content. One hidden page is hosted. Its URL (and content) is unique and random. The latest page changes over time so that we track evolution of indexing with pages aging. Link are withing this page so that crawlers can follow.',
}

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
