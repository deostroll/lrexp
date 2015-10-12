var connect = require('connect');
var http = require('http');
var app = connect();
var logger = require('morgan');
var fs = require('fs');
var cheerio = require('cheerio');
var path = require('path');
var rx_static = /\.(html|css|js|htm)$/;
var rx_html = /\.(html|htm)$/;

var isStatic = function(url) { return rx_static.test(url); };
var isHtml = function(url) { return rx_html.test(url); };
var files = [];

function walk(currentDirPath, callback) {
    var fs = require('fs'), path = require('path');
    fs.readdirSync(currentDirPath).forEach(function(name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walk(filePath, callback);
        }
    });
}

app.use(logger('dev'));

app.use('/livereload', function(req, res) {
	console.log({
		'url' : req.url,
		'query': req.query
	});

	res.end('this is livereload');
});

walk(path.resolve('src'), function(filename, stat){
	if(stat.isDirectory()) return;
	console.log(filename);
	files.push(filename);
});

var assetExists = function(assetUrl) {
	var filePath = path.resolve(path.join('src', path.basename(assetUrl)));
	return !!fs.statSync(filePath);
};

var trackId = 0;
var trackUrl = function(url) {

};

app.use(function(req, res, next) {
	console.log('middleware');
	var url = req.url;
	if(req.method === 'GET') {
		if(!isStatic(url)) {
			next();
		}
		if(isHtml(url)) {			
			if(assetExists(url)) {
				var html = fs.readFileSync(filePath, 'utf8');
				var $ = cheerio.load(html);
				$('link, script').each(function(_, el) {
					var asset = '';
					if(el.name === 'link') {
						asset = el.attribs.href;
					}
					else if(el.name === 'script' ) {
						asset = el.attribs.src;
					}

				});
				res.end(html);				
			}
			else {
				//file does not exist
				next();
			}
		}

	}
	else {
		next(); //
	}
});

http.createServer(app).listen(3000, function() {
	console.log('Listening...');
}).on('connection', function() {
	console.log('connected');
});

fs.watch('src', {
	recursive: true
}, function(event, filename){
	console.log('Watch Event', {
		event:event,
		filename: filename
	});
});