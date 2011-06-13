/*
|------------------------------------------------
| Box.js
|------------------------------------------------
|
| A cross-browser localStorage wrapper API.
|
| @author     James Brumond
| @version    0.1.1-dev
| @copyright  Copyright 2011 James Brumond
| @license    Dual licensed under MIT and GPL
|
| Original concept based on the work of Marcus Westin in store.js
| @link       https://github.com/marcuswestin/store.js
|
*/

window.Box = (new (function(window, undefined) {
	
	var
	self     = this,
	write    = null,
	read     = null,
	init     = null,
	values   = null,
	win      = window,
	doc      = win.document,
	support  = true,

	/**
	 * Serializes a variable using the given format
	 *
	 * @access  private
	 * @param   mixed     the variable to encode
	 * @param   string    the encoding format (default: 'json')
	 * @return  string
	 */
	encode = function(data, format) {
		if (format == null) {
			var format = 'json';
		}
		switch (format) {
			case 'json':
				return self.JSON.stringify(data);
			break;
			case 'serialize':
				return self.PHPSerial.serialize(data);
			break;
			case 'pickle':
				return self.PickleJS.dumps(data);
			break;
			default:
				throw new Error('Unknown serialization format "' + format + '"');
			break;
		}
	},

	/**
	 * Unserializes a variable using the given format
	 *
	 * @access  private
	 * @param   string    the variable to decode
	 * @param   string    the encoding format (default: 'json')
	 * @return  mixed
	 */
	decode = function(data, format) {
		if (format == null) {
			var format = 'json';
		}
		switch (format) {
			case 'json':
				return self.JSON.parse(data);
			break;
			case 'serialize':
				return self.PHPSerial.unserialize(data);
			break;
			case 'pickle':
				return self.PickleJS.loads(data);
			break;
			default:
				throw new Error('Unknown serialization format "' + format + '"');
			break;
		}
	},

	/**
	 * Check if localStorage is available
	 *
	 * @access  private
	 * @return  boolean
	 */
	hasLocalStorage = function() {
		try {
			return ('localStorage' in win && win.localStorage);
		} catch (e) { return false; }
	},

	/**
	 * Check if globalStorage is available
	 *
	 * @access  private
	 * @return  boolean
	 */
	hasGlobalStorage = function() {
		try {
			return ('globalStorage' in win && win.globalStorage && win.globalStorage[win.location.hostname]);
		} catch (e) { return false; }
	},

	/**
	 * Check if MSIE userData is available
	 *
	 * @access  private
	 * @return  boolean
	 */
	hasUserData = function() {
		return (typeof doc.documentElement.addBehavior === 'function');
	};

// ----------------------------------------------------------------------------
//  HTML5 localStorage Model

	if (hasLocalStorage()) {

		storage = win.localStorage;
		
		write = function(name, value) {
			storage.setItem(name, value);
		};

		read = function(name) {
			return storage.getItem(name);
		};

		del = function(name) {
			storage.removeItem(name);
		};

		delAll = function() {
			storage.clear();
		};

		each = function(func) {
			for (var i in storage) {
				if (storage.getItem(i)) {
					func(i);
				}
			}
		};

	}

// ----------------------------------------------------------------------------
//  HTML5 globalStorage Model

	else if (hasGlobalStorage()) {

		storage = win.globalStorage[win.location.hostname];
		
		write = function(name, value) {
			storage[name] = value;
		};

		read = function(name) {
			var value = storage[name] && storage[name].value;
			if (value) {
				value = value;
			}
			return value;
		};

		del = function(name) {
			delete storage[name];
		};

		each = function(func) {
			for (var i in storage) {
				if (storage.hasOwnProperty(i)) {
					func(i);
				}
			}
		};

	}

// ----------------------------------------------------------------------------
//  MSIE userData Model

	else if (hasUserData()) {

		storage = doc.createElement('div');
		
		var withStore = function(func) {
			return function() {
				doc.body.appendChild(storage);
				storage.addBehavior('#default#userData');
				storage.load('localStorage');
				var args = Array.prototype.slice.call(arguments, 0);
				args.unshift(storage);
				result = func.apply(win, args);
				doc.body.removeChild(storage);
				return result;
			};
		};

		write = withStore(function(storage, name, value) {
			storage.setAttribue(name, value);
			storage.save('localStorage');
		});

		read = withStore(function(storage, name) {
			return storage.getAttribute(name);
		});

		del = withStore(function(storage, name) {
			storage.removeAttribute(name);
			storage.save('localStorage');
		});

		each = withStore(function(storage, func) {
			var attrs = storage.XMLDocument.documentElement.attributes;
			for (var i = 0, c = attrs.length; i < c; i++) {
				func(attr);
			}
		});

	}

// ----------------------------------------------------------------------------
//  Non-support

	else {
		support = false;
	}

// ----------------------------------------------------------------------------
//  External Functions

	self.supported = function() {
		return support;
	};

	if (support) {
	
		/**
		 * Write a value to storage
		 *
		 * @access  public
		 * @param   string    the name to store under
		 * @param   mixed     the value to store
		 * @return  void
		 */
		self.store = function(name, value) {
			return write(name, encode(value));
		};

		/**
		 * Read a value from storage
		 *
		 * @access  public
		 * @param   string    the name to read from
		 * @return  mixed
		 */
		self.fetch = function(name) {
			return decode(read(name));
		};
		
		/**
		 * Check if a name is in storage
		 *
		 * @access  public
		 * @param   string    the name to read from
		 * @return  mixed
		 */
		self.isset = function(name) {
			return (!! read(name));
		};

		/**
		 * Remove a value from storage
		 *
		 * @access  public
		 * @param   string    the name to remove
		 * @return  void
		 */
		self.unset = function(name) {
			del(name);
		};
		
		/**
		 * Remove all values from storage
		 *
		 * @access  public
		 * @return  void
		 */
		self.empty =
			(typeof delAll === 'function') ?
				function() { delAll(); } :
				function() { each(del); };

		/**
		 * Dumps the data in serialized form
		 *
		 * @access  public
		 * @param   string    the serializing format
		 * @return  string
		 */
		self.dumps = function(format) {
			// Get the data out of the store
			var data = { };
			each(function(name) {
				data[name] = decode(read(name));
			})
			// Do the data processing
			return encode(data, format)
		};

		/**
		 * Loads serialized data into the store
		 *
		 * @access  public
		 * @param   string    the data to load
		 * @param   string    the serializing format
		 * @return  void
		 */
		self.loads = function(data, format) {
			// Do the data processing
			data = decode(data, format);
			// Add the data to the store
			for (var i in data) {
				if (data.hasOwnProperty(i)) {
					write(i, encode(data[i]));
				}
			}
		};

		// Actually attempt to read and write data
		try {
			self.store('TestName', 'TestValue');
			if (self.fetch('TestName') !== 'TestValue') {
				support = false;
			}
			self.unset('TestName');
		} catch (e) { support = false; }

	}

// ----------------------------------------------------------------------------
//  JSON Data Encoding Sub-module

	self.JSON = (function() {
		/**
		 * JavaScript JSON Implementation By Douglas Crockford
		 *
		 * @link  http://www.JSON.org/json2.js
		 * @link  http://www.JSON.org/json_parse.js
		 * @link  http://www.JSON.org/js.html
		 */
		var JSON;
		if (!JSON) {
			JSON = {};
		}

		(function () {
			"use strict";

			function f(n) {
				// Format integers to have at least two digits.
				return n < 10 ? '0' + n : n;
			}

			if (typeof Date.prototype.toJSON !== 'function') {

				Date.prototype.toJSON = function (key) {

					return isFinite(this.valueOf()) ?
						this.getUTCFullYear()	 + '-' +
						f(this.getUTCMonth() + 1) + '-' +
						f(this.getUTCDate())	  + 'T' +
						f(this.getUTCHours())	 + ':' +
						f(this.getUTCMinutes())   + ':' +
						f(this.getUTCSeconds())   + 'Z' : null;
				};

				String.prototype.toJSON	  =
					Number.prototype.toJSON  =
					Boolean.prototype.toJSON = function (key) {
						return this.valueOf();
					};
			}

			var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
				escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
				gap,
				indent,
				meta = {	// table of character substitutions
					'\b': '\\b',
					'\t': '\\t',
					'\n': '\\n',
					'\f': '\\f',
					'\r': '\\r',
					'"' : '\\"',
					'\\': '\\\\'
				},
				rep;


			function quote(string) {

		// If the string contains no control characters, no quote characters, and no
		// backslash characters, then we can safely slap some quotes around it.
		// Otherwise we must also replace the offending characters with safe escape
		// sequences.

				escapable.lastIndex = 0;
				return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
					var c = meta[a];
					return typeof c === 'string' ? c :
						'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				}) + '"' : '"' + string + '"';
			}


			function str(key, holder) {

		// Produce a string from holder[key].

				var i,		  // The loop counter.
					k,		  // The member key.
					v,		  // The member value.
					length,
					mind = gap,
					partial,
					value = holder[key];

		// If the value has a toJSON method, call it to obtain a replacement value.

				if (value && typeof value === 'object' &&
						typeof value.toJSON === 'function') {
					value = value.toJSON(key);
				}

		// If we were called with a replacer function, then call the replacer to
		// obtain a replacement value.

				if (typeof rep === 'function') {
					value = rep.call(holder, key, value);
				}

		// What happens next depends on the value's type.

				switch (typeof value) {
				case 'string':
					return quote(value);

				case 'number':

		// JSON numbers must be finite. Encode non-finite numbers as null.

					return isFinite(value) ? String(value) : 'null';

				case 'boolean':
				case 'null':

		// If the value is a boolean or null, convert it to a string. Note:
		// typeof null does not produce 'null'. The case is included here in
		// the remote chance that this gets fixed someday.

					return String(value);

		// If the type is 'object', we might be dealing with an object or an array or
		// null.

				case 'object':

		// Due to a specification blunder in ECMAScript, typeof null is 'object',
		// so watch out for that case.

					if (!value) {
						return 'null';
					}

		// Make an array to hold the partial results of stringifying this object value.

					gap += indent;
					partial = [];

		// Is the value an array?

					if (Object.prototype.toString.apply(value) === '[object Array]') {

		// The value is an array. Stringify every element. Use null as a placeholder
		// for non-JSON values.

						length = value.length;
						for (i = 0; i < length; i += 1) {
							partial[i] = str(i, value) || 'null';
						}

		// Join all of the elements together, separated with commas, and wrap them in
		// brackets.

						v = partial.length === 0 ? '[]' : gap ?
							'[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
							'[' + partial.join(',') + ']';
						gap = mind;
						return v;
					}

		// If the replacer is an array, use it to select the members to be stringified.

					if (rep && typeof rep === 'object') {
						length = rep.length;
						for (i = 0; i < length; i += 1) {
							if (typeof rep[i] === 'string') {
								k = rep[i];
								v = str(k, value);
								if (v) {
									partial.push(quote(k) + (gap ? ': ' : ':') + v);
								}
							}
						}
					} else {

		// Otherwise, iterate through all of the keys in the object.

						for (k in value) {
							if (Object.prototype.hasOwnProperty.call(value, k)) {
								v = str(k, value);
								if (v) {
									partial.push(quote(k) + (gap ? ': ' : ':') + v);
								}
							}
						}
					}

		// Join all of the member texts together, separated with commas,
		// and wrap them in braces.

					v = partial.length === 0 ? '{}' : gap ?
						'{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
						'{' + partial.join(',') + '}';
					gap = mind;
					return v;
				}
			}

		// If the JSON object does not yet have a stringify method, give it one.

			if (typeof JSON.stringify !== 'function') {
				JSON.stringify = function (value, replacer, space) {

		// The stringify method takes a value and an optional replacer, and an optional
		// space parameter, and returns a JSON text. The replacer can be a function
		// that can replace values, or an array of strings that will select the keys.
		// A default replacer method can be provided. Use of the space parameter can
		// produce text that is more easily readable.

					var i;
					gap = '';
					indent = '';

		// If the space parameter is a number, make an indent string containing that
		// many spaces.

					if (typeof space === 'number') {
						for (i = 0; i < space; i += 1) {
							indent += ' ';
						}

		// If the space parameter is a string, it will be used as the indent string.

					} else if (typeof space === 'string') {
						indent = space;
					}

		// If there is a replacer, it must be a function or an array.
		// Otherwise, throw an error.

					rep = replacer;
					if (replacer && typeof replacer !== 'function' &&
							(typeof replacer !== 'object' ||
							typeof replacer.length !== 'number')) {
						throw new Error('JSON.stringify');
					}

		// Make a fake root object containing our value under the key of ''.
		// Return the result of stringifying the value.

					return str('', {'': value});
				};
			}


		// If the JSON object does not yet have a parse method, give it one.

			if (typeof JSON.parse !== 'function') {
				JSON.parse = (function () {
					"use strict";

				// This is a function that can parse a JSON text, producing a JavaScript
				// data structure. It is a simple, recursive descent parser. It does not use
				// eval or regular expressions, so it can be used as a model for implementing
				// a JSON parser in other languages.

				// We are defining the function inside of another function to avoid creating
				// global variables.

					var at,	 // The index of the current character
						ch,	 // The current character
						escapee = {
							'"':  '"',
							'\\': '\\',
							'/':  '/',
							b:	'\b',
							f:	'\f',
							n:	'\n',
							r:	'\r',
							t:	'\t'
						},
						text,

						error = function (m) {

				// Call error when something is wrong.

							throw {
								name:	'SyntaxError',
								message: m,
								at:	  at,
								text:	text
							};
						},

						next = function (c) {

				// If a c parameter is provided, verify that it matches the current character.

							if (c && c !== ch) {
								error("Expected '" + c + "' instead of '" + ch + "'");
							}

				// Get the next character. When there are no more characters,
				// return the empty string.

							ch = text.charAt(at);
							at += 1;
							return ch;
						},

						number = function () {

				// Parse a number value.

							var number,
								string = '';

							if (ch === '-') {
								string = '-';
								next('-');
							}
							while (ch >= '0' && ch <= '9') {
								string += ch;
								next();
							}
							if (ch === '.') {
								string += '.';
								while (next() && ch >= '0' && ch <= '9') {
									string += ch;
								}
							}
							if (ch === 'e' || ch === 'E') {
								string += ch;
								next();
								if (ch === '-' || ch === '+') {
									string += ch;
									next();
								}
								while (ch >= '0' && ch <= '9') {
									string += ch;
									next();
								}
							}
							number = +string;
							if (!isFinite(number)) {
								error("Bad number");
							} else {
								return number;
							}
						},

						string = function () {

				// Parse a string value.

							var hex,
								i,
								string = '',
								uffff;

				// When parsing for string values, we must look for " and \ characters.

							if (ch === '"') {
								while (next()) {
									if (ch === '"') {
										next();
										return string;
									} else if (ch === '\\') {
										next();
										if (ch === 'u') {
											uffff = 0;
											for (i = 0; i < 4; i += 1) {
												hex = parseInt(next(), 16);
												if (!isFinite(hex)) {
													break;
												}
												uffff = uffff * 16 + hex;
											}
											string += String.fromCharCode(uffff);
										} else if (typeof escapee[ch] === 'string') {
											string += escapee[ch];
										} else {
											break;
										}
									} else {
										string += ch;
									}
								}
							}
							error("Bad string");
						},

						white = function () {

				// Skip whitespace.

							while (ch && ch <= ' ') {
								next();
							}
						},

						word = function () {

				// true, false, or null.

							switch (ch) {
							case 't':
								next('t');
								next('r');
								next('u');
								next('e');
								return true;
							case 'f':
								next('f');
								next('a');
								next('l');
								next('s');
								next('e');
								return false;
							case 'n':
								next('n');
								next('u');
								next('l');
								next('l');
								return null;
							}
							error("Unexpected '" + ch + "'");
						},

						value,  // Place holder for the value function.

						array = function () {

				// Parse an array value.

							var array = [];

							if (ch === '[') {
								next('[');
								white();
								if (ch === ']') {
									next(']');
									return array;   // empty array
								}
								while (ch) {
									array.push(value());
									white();
									if (ch === ']') {
										next(']');
										return array;
									}
									next(',');
									white();
								}
							}
							error("Bad array");
						},

						object = function () {

				// Parse an object value.

							var key,
								object = {};

							if (ch === '{') {
								next('{');
								white();
								if (ch === '}') {
									next('}');
									return object;   // empty object
								}
								while (ch) {
									key = string();
									white();
									next(':');
									if (Object.hasOwnProperty.call(object, key)) {
										error('Duplicate key "' + key + '"');
									}
									object[key] = value();
									white();
									if (ch === '}') {
										next('}');
										return object;
									}
									next(',');
									white();
								}
							}
							error("Bad object");
						};

					value = function () {

				// Parse a JSON value. It could be an object, an array, a string, a number,
				// or a word.

						white();
						switch (ch) {
						case '{':
							return object();
						case '[':
							return array();
						case '"':
							return string();
						case '-':
							return number();
						default:
							return ch >= '0' && ch <= '9' ? number() : word();
						}
					};

				// Return the json_parse function. It will have access to all of the above
				// functions and variables.

					return function (source, reviver) {
						var result;

						text = source;
						at = 0;
						ch = ' ';
						result = value();
						white();
						if (ch) {
							error("Syntax error");
						}

				// If there is a reviver function, we recursively walk the new structure,
				// passing each name/value pair to the reviver function for possible
				// transformation, starting with a temporary root object that holds the result
				// in an empty key. If there is not a reviver function, we simply return the
				// result.

						return typeof reviver === 'function' ? (function walk(holder, key) {
							var k, v, value = holder[key];
							if (value && typeof value === 'object') {
								for (k in value) {
									if (Object.prototype.hasOwnProperty.call(value, k)) {
										v = walk(value, k);
										if (v !== undefined) {
											value[k] = v;
										} else {
											delete value[k];
										}
									}
								}
							}
							return reviver.call(holder, key, value);
						}({'': result}, '')) : result;
					};
				}());
			}
		}());
		
		return JSON;
	}());

// ----------------------------------------------------------------------------
//  PHP Serialization Data Encoding Sub-module

	self.PHPSerial = (function() {
		var
		/**
		 * Encodes an ISO-8859-1 string to UTF-8
		 *
		 * @access  private
		 * @param   string    the string to encode
		 * @return  string
		 * @link    http://phpjs.org/functions/utf8_encode
		 */
		utf8_encode = function(argString) {
			var string = (argString + '');
			var utftext = "",
				start, end, stringl = 0;
		 
			start = end = 0;
			stringl = string.length;
			for (var n = 0; n < stringl; n++) {
				var c1 = string.charCodeAt(n);
				var enc = null;
		 
				if (c1 < 128) {
					end++;
				} else if (c1 > 127 && c1 < 2048) {
					enc = String.fromCharCode((c1 >> 6) | 192) +
						String.fromCharCode((c1 & 63) | 128);
				} else {
					enc = String.fromCharCode((c1 >> 12) | 224) +
						String.fromCharCode(((c1 >> 6) & 63) | 128) +
						String.fromCharCode((c1 & 63) | 128);
				}
				if (enc !== null) {
					if (end > start) {
						utftext += string.slice(start, end);
					}
					utftext += enc;
					start = end = n + 1;
				}
			}
		 
			if (end > start) {
				utftext += string.slice(start, stringl);
			}
		 
			return utftext;
		},
		/**
		 * Converts a UTF-8 encoded string to ISO-8859-1
		 *
		 * @access  private
		 * @param   string    the string to decode
		 * @return  string
		 */
		utf8_decode = function(str_data) {
			var tmp_arr = [],
				i = 0,
				ac = 0,
				c1 = 0,
				c2 = 0,
				c3 = 0;
		 
			str_data += '';
		 
			while (i < str_data.length) {
				c1 = str_data.charCodeAt(i);
				if (c1 < 128) {
					tmp_arr[ac++] = String.fromCharCode(c1);
					i++;
				} else if (c1 > 191 && c1 < 224) {
					c2 = str_data.charCodeAt(i + 1);
					tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
					i += 2;
				} else {
					c2 = str_data.charCodeAt(i + 1);
					c3 = str_data.charCodeAt(i + 2);
					tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}
		 
			return tmp_arr.join('');
		},
		/**
		 * PHP-style serialization function
		 *
		 * @access  public
		 * @param   mixed     the value to serialize
		 * @return  string
		 * @link    http://phpjs.org/functions/serialize
		 */
		serialize = function(mixed_value) {
			var _utf8Size = function (str) {
				var size = 0,
					i = 0,
					l = str.length,
					code = '';
				for (i = 0; i < l; i++) {
					code = str.charCodeAt(i);
					if (code < 0x0080) {
						size += 1;
					} else if (code < 0x0800) {
						size += 2;
					} else {
						size += 3;
					}
				}
				return size;
			};
			var _getType = function (inp) {
				var type = typeof inp,
					match;
				var key;
		 
				if (type === 'object' && !inp) {
					return 'null';
				}
				if (type === "object") {
					if (!inp.constructor) {
						return 'object';
					}
					var cons = inp.constructor.toString();
					match = cons.match(/(\w+)\(/);
					if (match) {
						cons = match[1].toLowerCase();
					}
					var types = ["boolean", "number", "string", "array"];
					for (key in types) {
						if (cons == types[key]) {
							type = types[key];
							break;
						}
					}
				}
				return type;
			};
			var type = _getType(mixed_value);
			var val, ktype = '';
		 
			switch (type) {
			case "function":
				val = "";
				break;
			case "boolean":
				val = "b:" + (mixed_value ? "1" : "0");
				break;
			case "number":
				val = (Math.round(mixed_value) == mixed_value ? "i" : "d") + ":" + mixed_value;
				break;
			case "string":
				val = "s:" + _utf8Size(mixed_value) + ":\"" + mixed_value + "\"";
				break;
			case "array":
			case "object":
				val = "a";
				var count = 0;
				var vals = "";
				var okey;
				var key;
				for (key in mixed_value) {
					if (mixed_value.hasOwnProperty(key)) {
						ktype = _getType(mixed_value[key]);
						if (ktype === "function") {
							continue;
						}
		 
						okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key);
						vals += serialize(okey) + serialize(mixed_value[key]);
						count++;
					}
				}
				val += ":" + count + ":{" + vals + "}";
				break;
			case "undefined":
				// Fall-through
			default:
				// If the JS object has a property which contains a null value, the string
				// cannot be unserialized by PHP
				val = "N";
				break;
			}
			if (type !== "object" && type !== "array") {
				val += ";";
			}
			return val;
		},
		/**
		 * PHP-style unserialization function
		 *
		 * @access  public
		 * @param   string    the value to unserialize
		 * @return  mixed
		 * @link    http://phpjs.org/functions/unserialize
		 */
		unserialize = function(data) {
			var that = this;
			var utf8Overhead = function (chr) {
				var code = chr.charCodeAt(0);
				if (code < 0x0080) {
					return 0;
				}
				if (code < 0x0800) {
					return 1;
				}
				return 2;
			};
		 
		 
			var error = function (type, msg, filename, line) {
				throw new window[type](msg, filename, line);
			};
			var read_until = function (data, offset, stopchr) {
				var buf = [];
				var chr = data.slice(offset, offset + 1);
				var i = 2;
				while (chr != stopchr) {
					if ((i + offset) > data.length) {
						error('Error', 'Invalid');
					}
					buf.push(chr);
					chr = data.slice(offset + (i - 1), offset + i);
					i += 1;
				}
				return [buf.length, buf.join('')];
			};
			var read_chrs = function (data, offset, length) {
				var buf;
		 
				buf = [];
				for (var i = 0; i < length; i++) {
					var chr = data.slice(offset + (i - 1), offset + i);
					buf.push(chr);
					length -= utf8Overhead(chr);
				}
				return [buf.length, buf.join('')];
			};
			var _unserialize = function (data, offset) {
				var readdata;
				var readData;
				var chrs = 0;
				var ccount;
				var stringlength;
				var keyandchrs;
				var keys;
		 
				if (!offset) {
					offset = 0;
				}
				var dtype = (data.slice(offset, offset + 1)).toLowerCase();
		 
				var dataoffset = offset + 2;
				var typeconvert = function (x) {
					return x;
				};
		 
				switch (dtype) {
				case 'i':
					typeconvert = function (x) {
						return parseInt(x, 10);
					};
					readData = read_until(data, dataoffset, ';');
					chrs = readData[0];
					readdata = readData[1];
					dataoffset += chrs + 1;
					break;
				case 'b':
					typeconvert = function (x) {
						return parseInt(x, 10) !== 0;
					};
					readData = read_until(data, dataoffset, ';');
					chrs = readData[0];
					readdata = readData[1];
					dataoffset += chrs + 1;
					break;
				case 'd':
					typeconvert = function (x) {
						return parseFloat(x);
					};
					readData = read_until(data, dataoffset, ';');
					chrs = readData[0];
					readdata = readData[1];
					dataoffset += chrs + 1;
					break;
				case 'n':
					readdata = null;
					break;
				case 's':
					ccount = read_until(data, dataoffset, ':');
					chrs = ccount[0];
					stringlength = ccount[1];
					dataoffset += chrs + 2;
		 
					readData = read_chrs(data, dataoffset + 1, parseInt(stringlength, 10));
					chrs = readData[0];
					readdata = readData[1];
					dataoffset += chrs + 2;
					if (chrs != parseInt(stringlength, 10) && chrs != readdata.length) {
						error('SyntaxError', 'String length mismatch');
					}
		 
					// Length was calculated on an utf-8 encoded string
					// so wait with decoding
					readdata = utf8_decode(readdata);
					break;
				case 'a':
					readdata = {};
		 
					keyandchrs = read_until(data, dataoffset, ':');
					chrs = keyandchrs[0];
					keys = keyandchrs[1];
					dataoffset += chrs + 2;
		 
					for (var i = 0; i < parseInt(keys, 10); i++) {
						var kprops = _unserialize(data, dataoffset);
						var kchrs = kprops[1];
						var key = kprops[2];
						dataoffset += kchrs;
		 
						var vprops = _unserialize(data, dataoffset);
						var vchrs = vprops[1];
						var value = vprops[2];
						dataoffset += vchrs;
		 
						readdata[key] = value;
					}
		 
					dataoffset += 1;
					break;
				default:
					error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
					break;
				}
				return [dtype, dataoffset - offset, typeconvert(readdata)];
			};
		 
			return _unserialize((data + ''), 0)[2];
		};
		return {
			serialize: serialize,
			unserialize: unserialize
		};
	}());

// ----------------------------------------------------------------------------
//  Python Pickling Data Encoding Sub-module

	self.PickleJS = (function() {
		/*

			http://code.google.com/p/pickle-js/
			pickle-js is not yet stable enough for including. when
			it is, it will be added here.

		*/
		var pickle = {
			dumps: function() { },
			loads: function() { }
		};
		return {
			dumps: function(data) {
				return pickle.dumps(data);
			},
			loads: function(data) {
				return pickle.loads(data);
			}
		};
	}());
	
})(window));

/* End of file box.js */
