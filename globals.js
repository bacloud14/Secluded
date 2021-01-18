var globals = {};
globals['sqlite'] = {
  "CREATE_TABLE_IF_NOT_EXISTS" : "CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT, content TEXT)",
  "INSERT_URL": "INSERT INTO URL(_id, url, content) VALUES (?,?,?)",
  "SELECT_URLS": "SELECT _id, timestamp, url, content FROM URL ORDER BY date(_id)",
  "SELECT_ONE_URL": "SELECT rowid, _id, timestamp, url, content FROM URL WHERE _id = ?"
}
// "resource", "timestamps", "endpoint", "isMobile", "isTablet", "isOpera", "isIE", "isEdge", "isIECompatibilityMode", "isSafari", "isFirefox", "isWebkit", "isChrome", "isDesktop", "isBot", "isFacebook", "silkAccelerated", "browser", "version", "os", "platform", "geoIp", "source", "isWechat", "critical"
globals['lowdb'] = {
  "CREATE_TABLE_IF_NOT_EXISTS" : "CREATE TABLE IF NOT EXISTS URL (_id TEXT primary KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, url TEXT, content TEXT)",
  "INSERT_URL": "INSERT INTO URL(_id, url, content) VALUES (?,?,?)",
  "SELECT_URLS": "SELECT _id, timestamp, url, content FROM URL ORDER BY date(_id)",
  "SELECT_ONE_URL": "SELECT rowid, _id, timestamp, url, content FROM URL WHERE _id = ?"
}
module.exports = globals;
