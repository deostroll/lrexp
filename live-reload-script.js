(function(document) {
	console.log('live reload');
	var tracker = {};
	var getQuery = function(url) {
		var query = {};
		var idx = url.indexOf('?');
		if( idx === -1) {
			return null;
		}
		else {
			
		}
		return query;
	};

	var items = [].slice.call(document.querySelectorAll('link, script'));
	var elCache = {};
	items.forEach(function(el) {
		var query;
		if(el.tagName === 'SCRIPT') {
			var src = el.src;
			if(src) {
				src.substr(src.indexOf('?') + 1).split('&').forEach(function(k) {
					var components = k.split('=');
					query[components[0]] = components[1];
				});
			}
		}

		elCache[query.ix] = {
			el: el
		}
	});
	function performRefresh(data) {
		console.log('data:', data);
		if(data && data.refresh) {
			window.location.reload();
			return;
		}
		items.forEach(function(el, idx){
			
		});
	}

	window.liveRefresh = performRefresh;
})(window.document);