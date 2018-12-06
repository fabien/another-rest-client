import Events from 'minivents'

function encodeUrl(data) {
    let res = '';
    for (let k in data)
        res += encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) + '&';
    return res.substr(0, res.length - 1);
}

function safe(func, data) {
    try {
        return func(data);
    }
    catch(e) {
        console.error('Error in function "' + func.name + '" while decode/encode data');
        console.log(func);
        console.log(data);
        console.log(e);
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
    return [merged];
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
            trailing: '',
            shortcut: true,
            shortcutRules: [],
            mergeParams: true,
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
        if (url.indexOf('?') === -1)
            url += this._opts.trailing;
        else
            url = url.replace('?', this._opts.trailing + '?');

        let xhr = new XMLHttpRequest();
        
        xhr.open(method, this.host + url, true);
        
        if (contentType) {
            let mime = this._opts[contentType];
            if (mime && mime.encode)
                data = safe(mime.encode, data);
            if (!(contentType === 'multipart/form-data' && data.constructor.name === 'FormData'))
                xhr.setRequestHeader('Content-Type', contentType);
        }
        
        let parameters = {
            method: method, data:data, url: url, contentType: contentType, headers: headers
        };
        
        for (let k in headers) {
            xhr.setRequestHeader(k, headers[k]);
        }

        let p = new Promise((resolve, reject) =>
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    this.emit('response', xhr, parameters);
                    p.emit('response', xhr, parameters);
                    if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204) {
                        this.emit('success', xhr, parameters);
                        p.emit('success', xhr, parameters);

                        let res = xhr.response;
                        let responseHeader = xhr.getResponseHeader('Content-Type');
                        if (responseHeader) {
                            let responseContentType = responseHeader.split(';')[0];
                            let mime = this._opts[responseContentType];
                            if (mime && mime.decode)
                                res = safe(mime.decode, res);
                        }
                        p.off();
                        resolve(res);
                    } else {
                        this.emit('error', xhr, parameters);
                        p.emit('error', xhr, parameters);
                        p.off();
                        reject(xhr, parameters);
                    }
                }
            }
        );
        p.xhr = xhr;
        new Events(p);
        setTimeout(() => {
            this.emit('request', xhr, parameters);
            p.emit('request', xhr, parameters);
            xhr.send(data);
        }, 0);
        return p;
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
    
    self._resources = {};
    self._shortcuts = {};
    self._parent = parent;
    self._headers = {};
    self._params = {};
    
    self._clone = (parent, newId, prefix, params, fn) => {
        let merged = Object.assign({}, baseParams, params);
        let copy = resource(client, parent, prefix || name, newId, ctx, merged, fn);
        copy._shortcuts = self._shortcuts;
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
        var url = Array.isArray(params) ? self.url.apply(self, params) : self.url(params);
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
        if (client._opts.mergeParams) params = mergeParams(params);
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
        let params = {};
        let fn;
        if (typeof args[args.length - 1] === 'function') {
            fn = args.pop();
        }
        if (typeof args[args.length - 1] === 'object') {
            Object.assign(params, args.pop());
        }
        let path = args.filter(filterParams).map(encodeURIComponent).join('/');
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
