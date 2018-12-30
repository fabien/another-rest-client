import Events from 'minivents'

function encodeUrl(a) {
    const s = [];
    
    const add = function (k, v) {
        v = typeof v === 'function' ? v() : v;
        v = v === null ? '' : v === undefined ? '' : v;
        s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
    };
    
    const buildParams = function (prefix, obj) {
        let i, len, key;
        if (prefix) {
            if (Array.isArray(obj)) {
                for (i = 0, len = obj.length; i < len; i++) {
                    buildParams(
                        (typeof obj[i] === 'object' && obj[i]) ? prefix + '[' + ( i ) + ']' : prefix,
                        obj[i]
                    );
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
        let value = func(data);
        if (typeof callback === 'function') callback(null, value);
        return value;
    }
    catch(e) {
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
    let merged = {};
    params.forEach(function(param) {
        if (typeof param === 'object') {
            Object.assign(merged, param);
        }
    });
    return merged;
}

function filterParams(value) {
    if (typeof value === 'object') {
        return Object.keys(value).length !== 0;
    } else {
        return value !== undefined;
    }
}

function extendObject(target, object) {
    for (let k in object) {
        if (typeof object[k] === 'function') {
            target[k] = bindFn(object[k], target);
        } else {
            target[k] = object[k];
        }
    }
}

function bindFn(func, context) {
    return function() {
        return func.apply(context, arguments);
    };
}

class RestClient {
    constructor(host, options) {
        this.host = host;
        this.conf(options);

        new Events(this);

        // resource must be super class of RestClient
        // but fucking js cannot into callable objects, so...
        // After this call all resource methods will be defined
        // on current RestClient instance (this behaviour affected by last parameter)
        // At least this parameters are symmetric :D
        resource(this, undefined, '', undefined, this);
    }

    conf(options={}) {
        let currentOptions = this._opts || {
            transport: 'default',
            trailing: '',
            shortcut: true,
            shortcutRules: [],
            mergeParams: true,
            errorInstances: true,
            contentType: 'application/json',
            'application/x-www-form-urlencoded': {encode: encodeUrl},
            'application/json': {encode: JSON.stringify, decode: JSON.parse}
        };

        this._opts = Object.assign(currentOptions, options);

        return Object.assign({}, this._opts);
    }
    
    extend(definition, match) {
        const client = this;
        let fn = (resource, parent, name, id) => true;
        if (typeof match === 'string') {
            fn = (resource, parent, name, id) => name === match;
        } else if (match instanceof RegExp) {
            fn = (resource, parent, name, id) => match.test(name);
        } else if (match === 'function') {
            fn = (resource, parent, name, id) => match.call(client, resource, parent, name, id);
        }
        this.on('resource', (resource, parent, name, id) => {
            if (fn(resource, parent, name, id)) {
                resource.extend(definition);
            }
        });
    }

    _request(method, url, data=null, headers={}, contentType=null) {
        if (url.indexOf('?') === -1) {
            url += this._opts.trailing;
        } else {
            url = url.replace('?', this._opts.trailing + '?');
        }
        
        if (contentType) {
            let mime = this._opts[contentType];
            if (mime && mime.encode)
                data = safe(mime.encode, data);
            if (!(contentType === 'multipart/form-data' && data.constructor.name === 'FormData'))
                headers['Content-Type'] = contentType;
        }
        
        let parameters = {
            method: method,
            data: data,
            url: this.host + url,
            contentType: contentType,
            headers: headers
        };
        
        const transport = RestClient.Transports[this._opts.transport];
        return transport(this, parameters, this._opts);
    }
}

function resource(client, parent, name, id, ctx, baseParams = {}, paramsFn) {
    let self = ctx ? ctx : (newId, params) => {
        if (typeof newId === 'object') {
            params = Object.assign({}, newId);
            newId = undefined;
        } else if (newId === undefined) {
            return self;
        }
        return self._clone(parent, newId, undefined, params);
    };
    
    if (parent === self) parent = undefined;
    
    self._resources = {};
    self._shortcuts = {};
    self._parent = parent;
    self._headers = {};
    self._params = {};
    
    self._clone = (parent, newId, prefix, params, fn) => {
        let merged = Object.assign({}, baseParams, params);
        let copy = resource(client, parent, prefix || name, newId, null, merged, fn);
        copy._shortcuts = Object.assign({}, self._shortcuts);
        for (let resName in self._resources) {
            copy._resources[resName] = self._resources[resName]._clone(copy, undefined, undefined, params, fn);
            if (resName in copy._shortcuts)
                copy[resName] = copy._resources[resName];
        }
        return copy;
    };

    self.res = (resources, shortcut=client._opts.shortcut, params, paramsFn) => {
        let makeRes = (resName) => {
            let options = {};
            let _params = Object.assign({}, params);
            if (typeof resName === 'object' && typeof resName.name === 'string') {
                options = Object.assign(options, resName);
                resName = options.name;
                if (options.shortcut !== undefined) shortcut = options.shortcut;
                _params = Object.assign({}, options.params, _params);
                paramsFn = options.paramsFn || paramsFn;
            }
            
            if (resName in self._resources)
                return self._resources[resName];
            
            let r = resource(client, self, resName, undefined, undefined, _params, paramsFn);
            
            self._resources[resName] = r;
            if (shortcut) {
                let shortcutName = typeof shortcut === 'string' ? shortcut : resName;
                self._shortcuts[shortcutName] = r;
                self[shortcutName] = r;
                client._opts.shortcutRules.forEach(rule => {
                    let customShortcut = rule(resName);
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
        if (resources.constructor === String)
            return makeRes(resources);

        if (resources instanceof Array)
            return resources.map(makeRes);

        if (resources instanceof Object) {
            let res = {};
            for (let resName in resources) {
                let r = makeRes(resName);
                if (resources[resName]) {
                    r.res(resources[resName]);
                }
                res[resName] = r;
            }
            return res;
        }
    };

    self.execute = (method, data, params, headers, contentType = client._opts.contentType) => {
        if (typeof headers === 'string') {
            contentType = headers;
            headers = {};
        } else if (typeof params === 'string') {
            contentType = params;
            params = {};
        }
        let url = Array.isArray(params) ? self.url.apply(self, params) : self.url(params);
        headers = Object.assign({}, self.getHeaders(), headers);
        return client._request(method, url, data, headers, contentType);
    };

    self._execute = (method, args) => {
        return self.execute.apply(self, [method].concat(args));
    };
    
    self.baseUrl = function() {
        let url = parent ? parent.baseUrl() : '';
        if (name) url += '/' + name;
        if (id !== undefined) url += '/' + id;
        return url;
    };

    self.url = (...args) => {
        let url = self.baseUrl();
        let params = [self.getParams()].concat(args);
        
        if (client._opts.mergeParams) {
            const keys = [];
            let index = 0;
            const urlParams = mergeParams(params);
            url = url.replace(/\/?[:\*](\w+)/g, function (segment, key) {
                index += 1; // always increment
                const value = urlParams[key] || urlParams[index];
                const blank = isUndefined(value) || isNull(value);
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
        
        const query = params.filter(filterParams).map((param) => {
            client.emit('params', param, self, parent, name, id);
            return encodeUrl(param);
        }).join('&');
        if (query) url += '?' + query;
        return url;
    };
    
    self.use = (...args) => {
        const resName = args.shift();
        let resource;
        if (Array.isArray(resName) || typeof resName === 'number') {
            resource = self.apply(self, [].concat(resName));
        } else {
            resource = self[resName];
        }
        if (typeof resource === 'function' &&
            typeof resource.use === 'function' && args.length > 0) {
            return resource.use.apply(resource, args);
        } else {
            return resource;
        }
    };
    
    self.id = (id) => {
        return self(id);
    },
    
    self.scope = (...args) => {
        args = [].concat(...args);
        let params = {};
        let fn;
        if (typeof args[args.length - 1] === 'function') {
            fn = args.pop();
        }
        if (typeof args[args.length - 1] === 'object') {
            Object.assign(params, args.pop());
        }
        let path = args.filter(filterParams).map(function(segment) {
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
    
    self.setParams = self.param = self.params = (key, value) => {
        if (typeof key === 'object') {
            Object.assign(self._params, key);
        } else if (typeof key === 'string') {
            self._params[key] = value;
        }
        return self;
    };
    
    self.getParams = () => {
        const _params = typeof paramsFn === 'function' ? paramsFn.call(self, parent, name, id) : {};
        return Object.assign({}, baseParams, parent ? parent.getParams() : {}, self._params, _params);
    };
    
    self.setHeaders = self.header = self.headers = (key, value) => {
        if (typeof key === 'object') {
            Object.assign(self._headers, key);
        } else if (typeof key === 'string') {
            self._headers[key] = value;
        }
        return self;
    };
    
    self.getHeaders = () => {
        return Object.assign({}, parent ? parent.getHeaders() : {}, self._headers);
    };

    if (!self.extend) {
        self.extend = (definition) => {
            if (typeof definition === 'object') {
                extendObject(self, definition);
            } else if (typeof definition === 'function') {
                const def = definition(self, parent, name, id);
                if (def) extendObject(self, typeof def === 'object' ? def : {});
            }
        };
    }

    // HTTP methods

    self.get = (...args) => {
        return self.execute('GET', {}, args);
    };

    self.post = (...args) => {
        return self._execute('POST', args);
    };

    self.put = (...args) => {
        return self._execute('PUT', args);
    };

    self.patch = (...args) => {
        return self._execute('PATCH', args);
    };

    self.delete = (...args) => {
        return self._execute('DELETE', args);
    };
    
    client.emit('resource', self, parent, name, id);
    
    return self;
}

module.exports = RestClient;

// Transports

RestClient.Transports = {};

RestClient.Transports['default'] = function(client, parameters, options = {}) {
    let { method, data, url, headers } = parameters;
    
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    
    for (let k in headers) {
        xhr.setRequestHeader(k, headers[k]);
    }

    let p = new Promise((resolve, reject) =>
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                handleResponse(client, p, xhr, parameters, options, resolve, reject);
            }
        }
    );
    
    p.xhr = xhr;
    new Events(p);
    
    setTimeout(() => {
        client.emit('request', xhr, parameters);
        p.emit('request', xhr, parameters);
        xhr.send(data);
    }, 0);
    
    return p;
};

RestClient.Transports['jquery'] = function(client, parameters, options = {}) {
    let xhr = $[options.jqueryAjax || 'ajax'](Object.assign({
        beforeSend: function(xhr) {
            client.emit('request', xhr, parameters);
            p.emit('request', xhr, parameters);
        }
    }, parameters));
    
    let p = new Promise((resolve, reject) => {
        p.xhr = xhr;
        new Events(p);
        xhr.done(function(data, textStatus, xhr) {
            handleResponse(client, p, xhr, parameters, options, resolve, reject, data);
        }).fail(function(xhr, textStatus, errorThrown) {
            handleResponseFail(client, p, xhr, parameters, options, resolve, reject, true);
        });
    });
    
    return p;
};

// Helpers

function parseResponse(response, client, p, xhr, parameters, options, resolve, reject) {
    let res = response || xhr.responseText;
    let responseHeader = xhr.getResponseHeader('Content-Type');
    if (responseHeader) {
        let responseContentType = responseHeader.split(';')[0];
        let mime = options[responseContentType];
        if (mime && mime.decode) {
            safe(mime.decode, res, function(err, res) {
                err ? reject(Object.assign(err, { xhr })) : resolve(res);
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

function emitError(client, p, xhr, parameters, error) {
    client.emit('error', xhr, parameters, error);
    p.emit('error', xhr, parameters, error);
    p.off();
};

function handleResponseFail(client, p, xhr, parameters, options, resolve, reject, responseEvent) {
    if (responseEvent) {
        client.emit('response', xhr, parameters);
        p.emit('response', xhr, parameters);
    }
    if (client._opts.errorInstances) {
        new Promise(function(succes, fail) {
            parseResponse(null, client, p, xhr, parameters, options, succes, fail);
        }).then(function(res) {
            let error = new Error('Request failed.');
            if (typeof res === 'object') {
                if (typeof res.error === 'object' && typeof res.error.message === 'string') {
                    error = new Error(res.error.message);
                }
                error.details = res;
            }
            error.xhr = xhr;
            emitError(client, p, xhr, parameters, error);
            reject(error, parameters);
        }, function(err) {
            emitError(client, p, xhr, parameters, err);
            reject(err, parameters);
        });
    } else {
        client.emit('error', xhr, parameters);
        p.emit('error', xhr, parameters);
        p.off();
        reject(xhr, parameters);
    }
};

function isNull(value) {
    return value === null && typeof value === 'object';
};

function isUndefined(value) {
    return typeof value === 'undefined';
};

function omit(obj, ...keysToOmit) {
    keysToOmit = [].concat(...keysToOmit);
    return Object.keys(obj).reduce((acc, key) => {
        if (keysToOmit.indexOf(key) === -1) acc[key] = obj[key];
        return acc;
    }, {});
};
