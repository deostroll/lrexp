var LIVE_RELOAD_PORT = 3454;
var STATIC_SERVE_PORT = 3000;
var STATIC_FOLDER = 'src';

var connect = require('connect');
var http = require('http');
var logger = require('morgan');
var fs = require('fs');
var cheerio = require('cheerio');
var path = require('path');
var urlib = require('url');
var serveStatic = require('serve-static');
var send = require('send');

var app = connect();
var lr = connect();

var rx_static = /\.(html|css|js|htm)$/;
var rx_html = /\.(html|htm)$/;

var isStatic = function(url) { return rx_static.test(url); };
var isHtml = function(url) { return rx_html.test(url); };
var getQuery = function(url) {
	var uri = urlib.parse(url);
	var query = {};
	uri.query.split('&').forEach(function(qsComponent){
		var component = qsComponent.split('=');
		query[decodeURIComponent(component[0])] = decodeURIComponent(component[1]);
	});
	return query;
};


var fcache = {};
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
walk(path.resolve(STATIC_FOLDER), function(filename, stat){
	if(stat.isDirectory()) return;
	console.log(filename);	
	fcache[filename] = new Date().getTime();
});

var watchRoutine = function(evt, filename) {
	console.log('FsWatch-',evt ,'-', filename);
	fcache[filename] = new Date().getTime();
};

// following code should be enabled on windows...
fs.watch(path.resolve(STATIC_FOLDER), { recursive: true }, function(evt, fname) {
	console.log('watch', {evt:evt, fname: fname});
	var file = path.resolve(path.join(STATIC_FOLDER, fname));
	console.log(file);
	fcache[file] = new Date().getTime();
});

// following code to do on linux...
// var fnWatchRoutine = function(filename) {
// 	console.log('Watch:', filename);
// 	fcache[filename] = new Date().getTime();
// };

// Object.keys(fcache).forEach(function(file){
// 	fs.watchFile(file, fnWatchRoutine.bind(this, file));
// });

console.log(fcache);
app.use(logger('dev'));
lr.use(logger('dev'));

app.use('/livereload', function(req, res) {
	var parts = urlib.parse(req.url);
	console.log(parts);

	res.end('this is livereload');
});

var assetInPath = function(assetUrl) {
	console.log('assetInPath: ', assetUrl);
	var filePath = path.resolve(path.join(STATIC_FOLDER, assetUrl));
	console.log('assetInPath: ', filePath);
	return !!fcache[filePath];
};

var getAssetPath = function(url) {	
	console.log('getAssetPath:', url);
	var filePath = path.resolve(path.join(STATIC_FOLDER, url));
	console.log('getAssetPath:', filePath);
	return filePath;
};

var assetId = 0;
var assets = [];
var session = 0;

var assetTrack = function(session, url) {
	if(assetInPath(url)) {
		var f = getAssetPath(url);
		var obj = assets[session];
		if(!obj.items) {
			obj.items = [];
		}
		var ix = obj.items.push({			
			url: url
		});
		Object.defineProperty(obj.items[obj.items.length - 1], '_', {
			enumerable: true,
			get: function() {
				return fcache[f];
			}
		});
		return url + '?s=' + session + '&_=' + fcache[f] + '&ix=' + (ix-1);
	}
	return url;
};

app.use(function(req, res, next) {	
	var url = req.url;
	if(req.method === 'GET') {
		if(!isStatic(url)) {
			next();
		}
		if(isHtml(url)) {			
			if(assetInPath(url)) {				
				var sobj = {session: session, items: []};
				assets.push(sobj);				
				var html = fs.readFileSync(getAssetPath(url), 'utf8');
				var $ = cheerio.load(html, {decodeEntities: false});
				assetTrack(session, url);				
				$('link, script').each(function(_, el) {
					var asset = '';
					if(el.name === 'link') {
						asset = el.attribs.href = assetTrack(session, el.attribs.href);
					}
					else if(el.name === 'script' ) {
						asset = el.attribs.src = assetTrack(session, el.attribs.src);
					}
					if(asset.indexOf('?')) {
						console.log('Tracked: ', asset);
					}
					else {
						console.log('Untracked:', asset);
					}
				});
				console.log("asset:", assets[0]);				
				var _ = assets[session].items[0]._;
				$('body').append('<script src="//localhost:' +
					LIVE_RELOAD_PORT +
					'/lrsetup?s=' +
					session +
					'&ix=' + 0 +
					'&_=' + _ + '"></script>');

				session++;
				var h = $.html();
				console.log(h);
				res.write(h);				
				console.log("done");
				res.end();
			}
			else {
				//file does not exist, but pass it to the next middleware...
				next();
			}
		}

	}
	else {
		next(); //
	}
});

app.use(serveStatic('src'));
app.use('/debug', function(req, res){
	res.end(JSON.stringify(assets, null, 2));
});

app.use(function(req, res){
	if(res.status < 450) {
		res.end();
	}
});


lr.use('/lrsetup', function(req, res) {
	send(req, 'live-reload-script.js').pipe(res);
});

lr.use('/refresh', function(req, res){
	res.writeHead({
		'Content-Type' : 'application/json',
		'Charset'	   : 'utf8'
	});
	//console.log(req.url, req.query);
	var url = req.url;
	//console.log('url:', url);
	var query = {};
	var idx = url.indexOf('?');
	url.substr(idx + 1).split('&').forEach(function(kvpair){
		console.log(kvpair);
		var c = kvpair.split('=');
		query[c[0]] = c[1];
	});

	req.query = query;
	//console.log('Query:', req.query);
	var asset = assets[req.query.s];
	console.log('asset', JSON.stringify(assets, null, 2));
	var o = asset.items.map(function(itm, idx){
		return { 
			ix: idx,
			_: itm._
		};
	});

	res.end(req.query.callback + '(' + JSON.stringify(o) + ')');
});

lr.listen(LIVE_RELOAD_PORT, function(){
	console.log('Live server running...');
	http.createServer(app).listen(STATIC_SERVE_PORT, function() {
	console.log('Static server running...');
	});
});
