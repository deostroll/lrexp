(function(document) {
	var scripts = document.body.getElementsByTagName('script'),
		script = scripts[scripts.length - 1],
		a = document.createElement('a'),
		props = ['host', 'protocol', 'query'],
		extract = function(url) {
			a.href = url;
			var o = {};
			props.forEach(function(p) {
				o[p] = a[p];
			});
			return o;
		},
		urlParts = extract(script.src);
	//console.log(urlParts);
	var pollUrl = urlParts.protocol + '//' + urlParts.host + '/refresh?callback=liveRefresh&s=0';
	function poll() {
		if(disableLiveRefresh) return;
		var script = document.createElement('script');
		script.src = pollUrl;
		script.addEventListener('load', function(){
			document.body.removeChild(script);
		}, false);
		document.body.appendChild(script);
	}

	function performRefresh(data) {
		console.log('data:', JSON.stringify(data, null, 2));
		console.log('elCache', JSON.stringify(elCache, null, 2));
		data.forEach(function(d) {
			var entry = elCache[d.ix];
			var el = entry.el;
			var _ = entry._;
			if(d._ !== _) {
				if(d.ix === 0) {
					window.location.reload();
					return;
				}
				if(el.tagName === 'LINK') {
					var old = el.href;
					var re = new RegExp(_);
					el.href = old.replace(re, d._);					
				}
				else {
					console.log('script:', el.src);
				}
				entry._ = d._;
			}
		});
	}

	var items = [].slice.call(document.querySelectorAll('link, script'));
	var elCache = {};
	items.forEach(function(el) {
		var query = {};
		var src;
		if(el.tagName === 'SCRIPT') {
			src = el.src;
			if(src) {
				src.substr(src.indexOf('?') + 1).split('&').forEach(function(k) {
					var components = k.split('=');
					query[components[0]] = components[1];
				});
			}
		}
		else {
			src = el.href;
			if(src) {
				src.substr(src.indexOf('?') + 1).split('&').forEach(function(k) {
					var components = k.split('=');
					query[components[0]] = components[1];
				});
			}	
		}
		if('ix' in query) {
			elCache[query.ix] = {
				el: el,
				_: +query._
			};
		}
	});
	console.log(elCache);
	window.liveRefresh = performRefresh;
	window.disableLiveRefresh = false;
	window.lrInterval = setInterval(poll, 1000);
})(window.document);