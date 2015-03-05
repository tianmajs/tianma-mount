var PATTERN_RULE = /^([^\/]+?)?(\/.*?)?$/;

/**
 * Whether the expect array could left align with the input array.
 * @param expect {Array}
 * @param input {Array}
 * @return {boolean}
 */
function match(expect, input) {
	return expect.every(function (value, index) {
		return value === input[index];
	});
}

/**
 * Split a string into an Array.
 * @param str {string}
 * @param delimiter {string}
 * @param [reverse] {boolean}
 * @return {Array}
 */
function split(str, delimiter, reverse) {
	var parts = str.split(delimiter).filter(function (value) {
		return value;
	})
	
	if (delimiter === '.') {
		parts.reverse();
	}
	
	return parts;
}

/**
 * Middleware factory.
 * @param rule {string}
 * @return {Function}
 */
module.exports = function (rule) {
	var re = (rule || '').match(PATTERN_RULE);
	
	// "www.example.com" => [ "com", "example", "www" ]
	var	hostname = split(re[1] || '', '.', true);
	
	// "/foo/bar/baz" => [ "foo", "bar", "baz" ]
	var pathname = split(re[2] || '', '/');
	
	// base should be "", "/foo", "/foo/bar", etc..
	var	base = pathname.length === 0 ? '' : '/' + pathname.join('/');
	
	return function *(next) {
		var req = this.request,
			originalBase = req.base;

		// Match hostname at first.
		if (!match(hostname, split(req.hostname, '.', true))) {
			return;
		}

		// Match pathname at last.
		if (!match(pathname, split(req.pathname, '/'))) {
			return;
		}
		
		// Trim the base so the sub middlewares won't cara about the mount path.
		req.url(req.pathname.replace(base, '') || '/');
		req.base = base;
		
		yield next;

		// Restore the original pathname.
		req.base = originalBase;
		req.url(base + req.pathname);
	};
};