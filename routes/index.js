var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
                        title: 'Secluded', 
                        message: 'Secluded is a webpage that tries to be isolated from web crawers although publically visible. It is a crawler behaviour experiment. Robots meta directives and robots.txt are pieces of code that provide crawlers instructions for how to crawl or index web page content.',
                        technique: 'One hidden page is hosted. Its URL is unique and random so that no one can. It also changes over time so that we track evolution of indexing over time. Its link is withing this page so that crawlers can follow, but hopefully other websites cannot directly link to. (although they technically can just like crawlers).'
                      });
});

module.exports = router;
