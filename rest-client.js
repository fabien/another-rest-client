(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["RestClient"] = factory();
	else
		root["RestClient"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _minivents = __webpack_require__(1);
	
	var _minivents2 = _interopRequireDefault(_minivents);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function encodeUrl(a) {
	    var s = [];
	
	    var add = function add(k, v) {
	        v = typeof v === 'function' ? v() : v;
	        v = v === null ? '' : v === undefined ? '' : v;
	        s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
	    };
	
	    var buildParams = function buildParams(prefix, obj) {
	        var i = void 0,
	            len = void 0,
	            key = void 0;
	        if (prefix) {
	            if (Array.isArray(obj)) {
	                for (i = 0, len = obj.length; i < len; i++) {
	                    buildParams(_typeof(obj[i]) === 'object' && obj[i] ? prefix + '[' + i + ']' : prefix, obj[i]);
	                }
	            } else if (String(obj) === '[object Object]') {
	                for (key in obj) {
	                    buildParams(prefix + '[' + key + ']', obj[key]);
	                }
	            } else {
	                add(prefix, obj);
	            }
	        } else if (Array.isArray(obj)) {
	            for (i = 0, len = obj.length; i < len; i++) {
	                add(obj[i].name, obj[i].value);
	            }
	        } else {
	            for (key in obj) {
	                buildParams(key, obj[key]);
	            }
	        }
	        return s;
	    };
	
	    return buildParams('', a).join('&');
	};
	
	function safe(func, data, callback) {
	    try {
	        var value = func(data);
	        if (typeof callback === 'function') callback(null, value);
	        return value;
	    } catch (e) {
	        if (typeof callback === 'function') {
	            callback(e);
	        } else {
	            console.error('Error in function "' + func.name + '" while decode/encode data');
	            console.log(func);
	            console.log(data);
	            console.log(e);
	        }
	        return data;
	    }
	}
	
	function mergeParams(params) {
	    var merged = {};
	    params.forEach(function (param) {
	        if ((typeof param === 'undefined' ? 'undefined' : _typeof(param)) === 'object') {
	            _extends(merged, param);
	        }
	    });
	    return merged;
	}
	
	function filterParams(value) {
	    if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
	        return Object.keys(value).length !== 0;
	    } else {
	        return value !== undefined;
	    }
	}
	
	function extendObject(target, object) {
	    for (var k in object) {
	        if (typeof object[k] === 'function') {
	            target[k] = bindFn(object[k], target);
	        } else {
	            target[k] = object[k];
	        }
	    }
	}
	
	function bindFn(func, context) {
	    return function () {
	        return func.apply(context, arguments);
	    };
	}
	
	var RestClient = function () {
	    function RestClient(host, options) {
	        _classCallCheck(this, RestClient);
	
	        this.host = host;
	        this.conf(options);
	
	        new _minivents2.default(this);
	
	        // resource must be super class of RestClient
	        // but fucking js cannot into callable objects, so...
	        // After this call all resource methods will be defined
	        // on current RestClient instance (this behaviour affected by last parameter)
	        // At least this parameters are symmetric :D
	        resource(this, undefined, '', undefined, this);
	    }
	
	    _createClass(RestClient, [{
	        key: 'conf',
	        value: function conf() {
	            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	
	            var currentOptions = this._opts || {
	                transport: 'default',
	                trailing: '',
	                shortcut: true,
	                shortcutRules: [],
	                mergeParams: true,
	                errorInstances: true,
	                contentType: 'application/json',
	                'application/x-www-form-urlencoded': { encode: encodeUrl },
	                'application/json': { encode: JSON.stringify, decode: JSON.parse }
	            };
	
	            this._opts = _extends(currentOptions, options);
	
	            return _extends({}, this._opts);
	        }
	    }, {
	        key: 'extend',
	        value: function extend(definition, match) {
	            var client = this;
	            var fn = function fn(resource, parent, name, id) {
	                return true;
	            };
	            if (typeof match === 'string') {
	                fn = function fn(resource, parent, name, id) {
	                    return name === match;
	                };
	            } else if (match instanceof RegExp) {
	                fn = function fn(resource, parent, name, id) {
	                    return match.test(name);
	                };
	            } else if (match === 'function') {
	                fn = function fn(resource, parent, name, id) {
	                    return match.call(client, resource, parent, name, id);
	                };
	            }
	            this.on('resource', function (resource, parent, name, id) {
	                if (fn(resource, parent, name, id)) {
	                    resource.extend(definition);
	                }
	            });
	        }
	    }, {
	        key: '_request',
	        value: function _request(method, url) {
	            var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
	            var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
	            var contentType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
	
	            if (url.indexOf('?') === -1) {
	                url += this._opts.trailing;
	            } else {
	                url = url.replace('?', this._opts.trailing + '?');
	            }
	
	            if (contentType) {
	                var mime = this._opts[contentType];
	                if (mime && mime.encode) data = safe(mime.encode, data);
	                if (!(contentType === 'multipart/form-data' && data.constructor.name === 'FormData')) headers['Content-Type'] = contentType;
	            }
	
	            var parameters = {
	                method: method,
	                data: data,
	                url: this.host + url,
	                contentType: contentType,
	                headers: headers
	            };
	
	            var transport = RestClient.Transports[this._opts.transport];
	            return transport(this, parameters, this._opts);
	        }
	    }]);
	
	    return RestClient;
	}();
	
	function resource(client, parent, name, id, ctx) {
	    var baseParams = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
	    var paramsFn = arguments[6];
	
	    var self = ctx ? ctx : function (newId, params) {
	        if ((typeof newId === 'undefined' ? 'undefined' : _typeof(newId)) === 'object') {
	            params = _extends({}, newId);
	            newId = undefined;
	        } else if (newId === undefined) {
	            return self;
	        }
	        return self._clone(parent, newId, undefined, params);
	    };
	
	    self._resources = {};
	    self._shortcuts = {};
	    self._parent = parent;
	    self._headers = {};
	    self._params = {};
	
	    self._clone = function (parent, newId, prefix, params, fn) {
	        var merged = _extends({}, baseParams, params);
	        var copy = resource(client, parent, prefix || name, newId, ctx, merged, fn);
	        copy._shortcuts = self._shortcuts;
	        for (var resName in self._resources) {
	            copy._resources[resName] = self._resources[resName]._clone(copy, undefined, undefined, params, fn);
	            if (resName in copy._shortcuts) copy[resName] = copy._resources[resName];
	        }
	        return copy;
	    };
	
	    self.res = function (resources) {
	        var shortcut = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : client._opts.shortcut;
	        var params = arguments[2];
	        var paramsFn = arguments[3];
	
	        var makeRes = function makeRes(resName) {
	            var options = {};
	            var _params = _extends({}, params);
	            if ((typeof resName === 'undefined' ? 'undefined' : _typeof(resName)) === 'object' && typeof resName.name === 'string') {
	                options = _extends(options, resName);
	                resName = options.name;
	                if (options.shortcut !== undefined) shortcut = options.shortcut;
	                _params = _extends({}, options.params, _params);
	                paramsFn = options.paramsFn || paramsFn;
	            }
	
	            if (resName in self._resources) return self._resources[resName];
	
	            var r = resource(client, self, resName, undefined, undefined, _params, paramsFn);
	
	            self._resources[resName] = r;
	            if (shortcut) {
	                var shortcutName = typeof shortcut === 'string' ? shortcut : resName;
	                self._shortcuts[shortcutName] = r;
	                self[shortcutName] = r;
	                client._opts.shortcutRules.forEach(function (rule) {
	                    var customShortcut = rule(resName);
	                    if (customShortcut && typeof customShortcut === 'string') {
	                        self._shortcuts[customShortcut] = r;
	                        self[customShortcut] = r;
	                    }
	                });
	            }
	
	            if (options.resources) r.res(options.resources); // Nested
	
	            return r;
	        };
	
	        // (resources instanceof String) don't work. Fuck you, javascript.
	        if (resources.constructor === String) return makeRes(resources);
	
	        if (resources instanceof Array) return resources.map(makeRes);
	
	        if (resources instanceof Object) {
	            var res = {};
	            for (var resName in resources) {
	                var r = makeRes(resName);
	                if (resources[resName]) {
	                    r.res(resources[resName]);
	                }
	                res[resName] = r;
	            }
	            return res;
	        }
	    };
	
	    self.execute = function (method, data, params, headers) {
	        var contentType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : client._opts.contentType;
	
	        if (typeof headers === 'string') {
	            contentType = headers;
	            headers = {};
	        } else if (typeof params === 'string') {
	            contentType = params;
	            params = {};
	        }
	        var url = Array.isArray(params) ? self.url.apply(self, params) : self.url(params);
	        headers = _extends({}, self.getHeaders(), headers);
	        return client._request(method, url, data, headers, contentType);
	    };
	
	    self._execute = function (method, args) {
	        return self.execute.apply(self, [method].concat(args));
	    };
	
	    self.baseUrl = function () {
	        var url = parent ? parent.baseUrl() : '';
	        if (name) url += '/' + name;
	        if (id !== undefined) url += '/' + id;
	        return url;
	    };
	
	    self.url = function () {
	        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	            args[_key] = arguments[_key];
	        }
	
	        var url = self.baseUrl();
	        var params = [self.getParams()].concat(args);
	
	        if (client._opts.mergeParams) {
	            var keys = [];
	            var index = 0;
	            var urlParams = mergeParams(params);
	            url = url.replace(/\/?[:\*](\w+)/g, function (segment, key) {
	                index += 1; // always increment
	                var value = urlParams[key] || urlParams[index];
	                var blank = isUndefined(value) || isNull(value);
	                if (!blank) keys.push(key);
	                if (url.indexOf(segment) === 0 && !blank) {
	                    return encodeURIComponent(value);
	                } else if (!blank) {
	                    return '/' + encodeURIComponent(value);
	                } else {
	                    return '';
	                }
	            });
	            params = [omit(urlParams, keys)];
	        }
	
	        var query = params.filter(filterParams).map(function (param) {
	            client.emit('params', param, self, parent, name, id);
	            return encodeUrl(param);
	        }).join('&');
	        if (query) url += '?' + query;
	        return url;
	    };
	
	    self.use = function () {
	        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	            args[_key2] = arguments[_key2];
	        }
	
	        var resName = args.shift();
	        var resource = void 0;
	        if (Array.isArray(resName) || typeof resName === 'number') {
	            resource = self.apply(self, [].concat(resName));
	        } else {
	            resource = self[resName];
	        }
	        if (typeof resource === 'function' && typeof resource.use === 'function' && args.length > 0) {
	            return resource.use.apply(resource, args);
	        } else {
	            return resource;
	        }
	    };
	
	    self.id = function (id) {
	        return self(id);
	    }, self.scope = function () {
	        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	            args[_key3] = arguments[_key3];
	        }
	
	        var params = {};
	        var fn = void 0;
	        if (typeof args[args.length - 1] === 'function') {
	            fn = args.pop();
	        }
	        if (_typeof(args[args.length - 1]) === 'object') {
	            _extends(params, args.pop());
	        }
	        var path = args.filter(filterParams).map(function (segment) {
	            if (typeof segment === 'string' && segment.match(/^:/)) {
	                return segment;
	            } else {
	                return encodeURIComponent(segment);
	            }
	        }).join('/');
	        if (path === '') {
	            return self._clone(parent, id, undefined, params, fn);
	        } else {
	            return self._clone(self, undefined, path, params, fn);
	        }
	    };
	
	    self.setParams = self.param = self.params = function (key, value) {
	        if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
	            _extends(self._params, key);
	        } else if (typeof key === 'string') {
	            self._params[key] = value;
	        }
	        return self;
	    };
	
	    self.getParams = function () {
	        var _params = typeof paramsFn === 'function' ? paramsFn.call(self, parent, name, id) : {};
	        return _extends({}, baseParams, parent ? parent.getParams() : {}, self._params, _params);
	    };
	
	    self.setHeaders = self.header = self.headers = function (key, value) {
	        if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
	            _extends(self._headers, key);
	        } else if (typeof key === 'string') {
	            self._headers[key] = value;
	        }
	        return self;
	    };
	
	    self.getHeaders = function () {
	        return _extends({}, parent ? parent.getHeaders() : {}, self._headers);
	    };
	
	    if (!self.extend) {
	        self.extend = function (definition) {
	            if ((typeof definition === 'undefined' ? 'undefined' : _typeof(definition)) === 'object') {
	                extendObject(self, definition);
	            } else if (typeof definition === 'function') {
	                var def = definition(self, parent, name, id);
	                if (def) extendObject(self, (typeof def === 'undefined' ? 'undefined' : _typeof(def)) === 'object' ? def : {});
	            }
	        };
	    }
	
	    // HTTP methods
	
	    self.get = function () {
	        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	            args[_key4] = arguments[_key4];
	        }
	
	        return self.execute('GET', {}, args);
	    };
	
	    self.post = function () {
	        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	            args[_key5] = arguments[_key5];
	        }
	
	        return self._execute('POST', args);
	    };
	
	    self.put = function () {
	        for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
	            args[_key6] = arguments[_key6];
	        }
	
	        return self._execute('PUT', args);
	    };
	
	    self.patch = function () {
	        for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
	            args[_key7] = arguments[_key7];
	        }
	
	        return self._execute('PATCH', args);
	    };
	
	    self.delete = function () {
	        for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
	            args[_key8] = arguments[_key8];
	        }
	
	        return self._execute('DELETE', args);
	    };
	
	    client.emit('resource', self, parent, name, id);
	
	    return self;
	}
	
	module.exports = RestClient;
	
	// Transports
	
	RestClient.Transports = {};
	
	RestClient.Transports['default'] = function (client, parameters) {
	    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	    var method = parameters.method,
	        data = parameters.data,
	        url = parameters.url,
	        headers = parameters.headers;
	
	
	    var xhr = new XMLHttpRequest();
	    xhr.open(method, url, true);
	
	    for (var k in headers) {
	        xhr.setRequestHeader(k, headers[k]);
	    }
	
	    var p = new Promise(function (resolve, reject) {
	        return xhr.onreadystatechange = function () {
	            if (xhr.readyState === 4) {
	                handleResponse(client, p, xhr, parameters, options, resolve, reject);
	            }
	        };
	    });
	
	    p.xhr = xhr;
	    new _minivents2.default(p);
	
	    setTimeout(function () {
	        client.emit('request', xhr, parameters);
	        p.emit('request', xhr, parameters);
	        xhr.send(data);
	    }, 0);
	
	    return p;
	};
	
	RestClient.Transports['jquery'] = function (client, parameters) {
	    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	
	    var xhr = $[options.jqueryAjax || 'ajax'](_extends({
	        beforeSend: function beforeSend(xhr) {
	            client.emit('request', xhr, parameters);
	            p.emit('request', xhr, parameters);
	        }
	    }, parameters));
	
	    var p = new Promise(function (resolve, reject) {
	        p.xhr = xhr;
	        new _minivents2.default(p);
	        xhr.done(function (data, textStatus, xhr) {
	            handleResponse(client, p, xhr, parameters, options, resolve, reject, data);
	        }).fail(function (xhr, textStatus, errorThrown) {
	            handleResponseFail(client, p, xhr, parameters, options, resolve, reject, true);
	        });
	    });
	
	    return p;
	};
	
	// Helpers
	
	function parseResponse(response, client, p, xhr, parameters, options, resolve, reject) {
	    var res = response || xhr.responseText;
	    var responseHeader = xhr.getResponseHeader('Content-Type');
	    if (responseHeader) {
	        var responseContentType = responseHeader.split(';')[0];
	        var mime = options[responseContentType];
	        if (mime && mime.decode) {
	            safe(mime.decode, res, function (err, res) {
	                err ? reject(_extends(err, { xhr: xhr })) : resolve(res);
	            });
	            return;
	        }
	    }
	    resolve(res);
	};
	
	function handleResponse(client, p, xhr, parameters, options, resolve, reject, response) {
	    client.emit('response', xhr, parameters);
	    p.emit('response', xhr, parameters);
	    if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204) {
	        client.emit('success', xhr, parameters);
	        p.emit('success', xhr, parameters);
	        p.off();
	        parseResponse(response, client, p, xhr, parameters, options, resolve, reject);
	    } else {
	        handleResponseFail(client, p, xhr, parameters, options, resolve, reject);
	    }
	};
	
	function handleResponseFail(client, p, xhr, parameters, options, resolve, reject, responseEvent) {
	    if (responseEvent) {
	        client.emit('response', xhr, parameters);
	        p.emit('response', xhr, parameters);
	    }
	    client.emit('error', xhr, parameters);
	    p.emit('error', xhr, parameters);
	    p.off();
	    if (client._opts.errorInstances) {
	        new Promise(function (succes, fail) {
	            parseResponse(null, client, p, xhr, parameters, options, succes, fail);
	        }).then(function (res) {
	            var error = new Error('Request failed.');
	            if ((typeof res === 'undefined' ? 'undefined' : _typeof(res)) === 'object') {
	                if (_typeof(res.error) === 'object' && typeof res.error.message === 'string') {
	                    error = new Error(res.error.message);
	                }
	                error.details = res;
	            }
	            error.xhr = xhr;
	            reject(error, parameters);
	        }, function (err) {
	            reject(err, parameters);
	        });
	    } else {
	        reject(xhr, parameters);
	    }
	};
	
	function isNull(value) {
	    return value === null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
	};
	
	function isUndefined(value) {
	    return typeof value === 'undefined';
	};
	
	function omit(obj) {
	    var _ref;
	
	    for (var _len9 = arguments.length, keysToOmit = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
	        keysToOmit[_key9 - 1] = arguments[_key9];
	    }
	
	    keysToOmit = (_ref = []).concat.apply(_ref, _toConsumableArray(keysToOmit));
	    return Object.keys(obj).reduce(function (acc, key) {
	        if (keysToOmit.indexOf(key) === -1) acc[key] = obj[key];
	        return acc;
	    }, {});
	};

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports=function(n){var t={},e=[];n=n||this,n.on=function(e,r,l){return(t[e]=t[e]||[]).push([r,l]),n},n.off=function(r,l){r||(t={});for(var o=t[r]||e,u=o.length=l?o.length:0;u--;)l==o[u][0]&&o.splice(u,1);return n},n.emit=function(r){for(var l,o=t[r]||e,u=o.length>0?o.slice(0,o.length):o,i=0;l=u[i++];)l[0].apply(l[1],e.slice.call(arguments,1));return n}};

/***/ })
/******/ ])
});
;
//# sourceMappingURL=rest-client.js.map