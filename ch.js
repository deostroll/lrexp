var cheerio = require('cheerio');
var $ = cheerio.load('<ul id="fruits">你可能感兴趣</ul>', {
    decodeEntities: false
});
var r1 = $.html();

$ = cheerio.load('<ul id="fruits">你可能感兴趣</ul>', {
    decodeEntities: true
});

var r2 = $.html();

var obj = {
	'r1' : r1,
	'r2' : r2
};

require('fs').writeFile('out.txt', JSON.stringify(obj, null, 2), 'utf8', function(err){
	if(err) {
		console.error(err);
		return;
	}

	console.log('done');
});