var connect = require('connect');
var http = require('http');
var app = connect();
var logger = require('morgan');
var fs = require('fs');
var cheerio = require('cheerio');

var rx_static = /\.(html|css|js|htm)$/;
var rx_html = /\.(html|htm)$/;

var isStatic = function(url) {
	return rx_static.test(url);
};

var isHtml = function(url) { return rx_html.test(url); };

app.use(logger('dev'));

app.use('/livereload', function(req, res) {
	res.end('this is livereload');
});

app.use(function(res, req, next) {
	if(req.method === 'GET') {
		if(!isStatic(url)) {
			next();
		}
		if(isHtml(url)) {
			var file = path.basename(url);
			var filePath = path.resolve(path.join(options.directory, file));
			var stat = fs.statSync(filePath);
			if(stat) {
				var html = fs.readFileSync(filePath, 'utf8');
				var $ = cheerio.load(html);
				$('link, script').forEach(function(_, el) {

				});
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