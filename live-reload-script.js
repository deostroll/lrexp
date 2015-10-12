(function(document){
	var tracker = {};
	var getQuery = function(url) {
		var query = {};
		var idx = url.indexOf('?')
		if( idx > -1) {
			var part = url.substr(idx + 1);
			
		}
		return query;
	};

	var items = [].slice.call(document.querySelectorAll('link, script'));

})(document)