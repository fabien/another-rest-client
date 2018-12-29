var should = require('chai').should();
var sinon = require('sinon');
var FormData = require('form-data');

var RestClient = require('../rest-client');

var host = 'http://example.com';

var xhr = global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();

global.FormData = FormData;

describe('RestClient', () => {
    describe('#_request()', () => {
        var api;

        beforeEach(() => {
            api = new RestClient(host);
            api.res('cookies');
        });

        it('should append trailing symbol which passed to constructor', () => {
            var req;
            xhr.onCreate = r => req = r;

            new RestClient(host, {trailing: '/'}).res('cookies').get();
            req.url.should.be.equal(host + '/cookies/');
        });

        it('should append trailing symbol before args', () => {
            var req;
            xhr.onCreate = r => req = r;

            new RestClient(host, {trailing: '/'}).res('cookies').get({fresh: true});
            req.url.should.be.equal(host + '/cookies/?fresh=true');
        });

        it('should emit events', (done) => {
            var req, bool;
            xhr.onCreate = r => req = r;

            var p = api.on('request', xhr => bool = true).cookies.get({fresh: true});
            req.url.should.be.equal(host + '/cookies?fresh=true');

            setTimeout(() => req.respond(200, [], '{a:1}'), 0);

            p.then(() => {
                bool.should.be.equal(true)
                done();
            }).catch(done);
        });

        it('should correct handle form data', () => {
            var req;
            xhr.onCreate = r => req = r;

            var p = api.cookies.post(new FormData(), 'multipart/form-data');
            req.url.should.be.equal(host + '/cookies');
            (typeof req.requestHeaders['Content-Type']).should.be.equal('undefined');
        });
    });
});


describe('resource', () => {
    
    describe('#res()', () => {
        var api;

        beforeEach(() => { api = new RestClient(host); });

        it('should accept resource name and return resource', () => {
            var cookies = api.res('cookies');
            cookies.should.be.a('function');
        });

        it('should accept array of resource names and return array of resources', () => {
            var t = api.res(['bees', 'cows']);
            t.should.be.an('array');
            api.bees.should.be.a('function');
            api.cows.should.be.a('function');
        });
        
        it('should accept array of resource names and return array of resources - complex', () => {
            var t = api.res([
                { name: 'bees' },
                { name: 'cows' },
                {
                    name: 'post',
                    shortcut: 'item',
                    params: { foo: 'bar' },
                    paramsFn: function(parent, name, id) {
                        return { example: name };
                    }
                }
            ]);
            t.should.be.an('array');
            api.bees.should.be.a('function');
            api.cows.should.be.a('function');
            api.item.should.be.a('function');
            api.item.url().should.be.equal('/post?foo=bar&example=post');
        });

        it('should accept object of resource names and return object of resources', () => {
            var t = api.res({
                'bees': [
                    'big',
                    'small',
                    { name: 'tiny' }
                ],
                'cows': {
                    'white': 'good'
                },
                'dogs': 0,
                'demo': [
                    {
                        name: 'test',
                        params: { foo: 'bar' },
                        resources: 'deep'
                    },
                    {
                        name: 'example',
                        resources: [
                            'other',
                            { name: 'deeper', shortcut: 'more' }
                        ]
                    }
                ]
            });
            t.should.be.an('object');

            api.bees.should.be.a('function');
            api.bees.big.should.be.a('function');
            api.bees.small.should.be.a('function');
            api.bees.tiny.should.be.a('function');

            api.cows.should.be.a('function');
            api.cows.white.should.be.a('function');
            api.cows.white.good.should.be.a('function');

            api.dogs.should.be.a('function');
            
            api.demo.should.be.a('function');
            api.demo.test.should.be.a('function');
            api.demo.example.should.be.a('function');
            api.demo.example.other.should.be.a('function');
            api.demo.example.more.should.be.a('function');
            
            api.demo.test.url().should.be.equal('/demo/test?foo=bar');
            api.demo.test.deep.url().should.be.equal('/demo/test/deep?foo=bar');
            api.demo.example.more.url().should.be.equal('/demo/example/deeper');
            
            api.demo(5, { baz: 'quux' }).url().should.be.equal('/demo/5?baz=quux');
            
            api.demo({ baz: 'quux' }).test.url().should.be.equal('/demo/test?foo=bar&baz=quux');
            api.demo.test.url({ foo: 'override' }).should.be.equal('/demo/test?foo=override');
            
            api.use('demo', 'example', 'more').url().should.be.equal('/demo/example/deeper');
        });

        it('should make a shortcut for resource by default', () => {
            api.should.not.have.property('cookies');
            var cookies = api.res('cookies');
            api.cookies.should.be.equal(cookies);
        });

        it('should make a shortcut for resource array by default', () => {
            api.should.not.have.property('cookies');
            api.should.not.have.property('cows');

            var arr = api.res(['cookies', 'cows']);

            api.cookies.should.be.equal(arr[0]);
            api.cows.should.be.equal(arr[1]);
        });

        it('should not make a shortcut if pass option to constructor', () => {
            var api = new RestClient(host, {shortcut: false});
            api.should.not.have.property('cookies');
            var cookies = api.res('cookies');
            api.should.not.have.property('cookies');
        });

        it('should not make a shortcut if pass false to second option', () => {
            api.should.not.have.property('cookies');
            var cookies = api.res('cookies', false);
            api.should.not.have.property('cookies');
        });
        
        it('should make a shortcut using the second option', () => {
            api.should.not.have.property('cookies');
            var cookies = api.res('scope', 'fetch');
            api.should.have.property('fetch');
            api.fetch.url().should.be.equal('/scope');
        });

        it('should cache created resources', () => {
            var cookies = api.res('cookies');
            cookies.should.be.a('function');
            var cookies2 = api.res('cookies');
            cookies.should.be.eql(cookies2);
        });

        it('should add additional shortcuts for custom rules', () => {
            var r = /(-)(.)/g;
            var api = new RestClient(host, {shortcutRules: [
                resName => resName.replace(r, (match, p1, p2) => p2.toUpperCase()),
            ]});

            api.should.not.have.property('cookies-and-biscuits');
            api.should.not.have.property('cookiesAndBiscuits');

            var cookiesAndBiscuits = api.res('cookies-and-biscuits');

            cookiesAndBiscuits.should.be.a('function');
            api['cookies-and-biscuits'].should.be.equal(cookiesAndBiscuits);
            api.cookiesAndBiscuits.should.be.equal(cookiesAndBiscuits);
        });
    });

    describe('#extend', () => {
        var api;
    
        beforeEach(() => {
            api = new RestClient(host);
            api.extend({
                filter: function(params) {
                    this._filter = this._filter || {};
                    let filter = this._filter;
                    Object.assign(filter, typeof params === 'object' ? params : {});
                    return this.scope(function() {
                        return { filter: JSON.stringify(filter) };
                    });
                },
                find: function(filter, params) {
                    return this.filter(filter).get(params);
                }
            });
            api.extend(function(resource, parent, name, id) {
                resource.demo = function() {
                    return this.get({ demo: true });
                };
            });
            api.res('cookies');
        });
    
        it('should extend the endpoint (1)', () => {
            var filteredCookies = api.cookies.filter({ foo: 'bar' });
            filteredCookies.url().should.eql('/cookies?filter=%7B%22foo%22%3A%22bar%22%7D');
            filteredCookies.filter({
                foo: 'test', baz: 'quux'
            }).url().should.eql('/cookies?filter=%7B%22foo%22%3A%22test%22%2C%22baz%22%3A%22quux%22%7D');
        });
        
        it('should extend the endpoint (2)', () => {
            var req;
            xhr.onCreate = r => req = r;

            api.cookies.find({ where: { foo: 'bar' } }, { page: 2 });
            req.url.should.be.equal(host + '/cookies?filter=%7B%22where%22%3A%7B%22foo%22%3A%22bar%22%7D%7D&page=2');
        });
        
        it('should extend the endpoint (3)', () => {
            var req;
            xhr.onCreate = r => req = r;

            api.cookies.demo();
            req.url.should.be.equal(host + '/cookies?demo=true');
        });
        
        it('should extend the endpoint (4)', () => {
            api.cookies.extend({
                other: function() {
                    return this.scope('other', { foo: 'bar' });
                }
            });
            api.cookies.other().url().should.eql('/cookies/other?foo=bar');
            api.cookies.other().filter({
                baz: 'quux'
            }).url().should.eql('/cookies/other?foo=bar&filter=%7B%22baz%22%3A%22quux%22%7D');
        });
        
    });

    describe('#url()', () => {
        var api;

        beforeEach(() => {
            api = new RestClient(host);
            api.res('cookies');
        });

        it('should build correct resource url', () => {
            api.cookies.url().should.be.equal('/cookies');
        });

        it('should build correct resource instance url', () => {
            api.cookies(42).url().should.be.equal('/cookies/42');
        });

        it('should build correct resource url if two in stack', () => {
            api.cookies.res('bakers');
            api.cookies(42).bakers(24).url().should.be.equal('/cookies/42/bakers/24');
        });

        it('should build correct resource url if more than two in stack', () => {
            api.cookies.res('bakers').res('cats');
            api.cookies(42).bakers.cats.url().should.be.equal('/cookies/42/bakers/cats');
            api.cookies(42).bakers(24).cats(15).url().should.be.equal('/cookies/42/bakers/24/cats/15');
        });
        
        it('should build correct resource url with params', () => {
            api.cookies.url({ foo: 'bar' }).should.be.equal('/cookies?foo=bar');
        });
        
        it('should build correct resource url with multiple params', () => {
            api.cookies.url({ foo: 'bar' }, { baz: 'quux' }).should.be.equal('/cookies?foo=bar&baz=quux');
        });
        
        it('should build correct resource url with nested params', () => {
            api.cookies.url({
                foo: 'bar',
                baz: 'quux',
                where: { id: { inq: ['foo', 'bar'] } }
            }).should.be.equal('/cookies?foo=bar&baz=quux&where%5Bid%5D%5Binq%5D=foo&where%5Bid%5D%5Binq%5D=bar');
        });
        
        it('should build correct resource url with placeholder interpolation', () => {
            api.cookies.scope(':id').url().should.be.equal('/cookies');
            api.cookies.scope(':id').url({ id: 123 }).should.be.equal('/cookies/123');
            api.cookies.scope(':id').url({ id: 'one two' }).should.be.equal('/cookies/one%20two');
            api.cookies.scope(':id', ':fk').url({ id: 'one', fk: 'two' }).should.be.equal('/cookies/one/two');
            api.cookies.scope(':id').url({ id: 123, foo: 'bar' }).should.be.equal('/cookies/123?foo=bar');
            
            var scope = api.cookies.scope([':id', 'things', ':fk'], { id: 123, fk: 'abc' });
            scope.url().should.equal('/cookies/123/things/abc');
            scope.url({ id: 456 }).should.equal('/cookies/456/things/abc');
        });
        
        it('should emit params event', () => {
            api.on('params', (params) => {
                if (typeof params.baz === 'string') {
                    params.baz = params.baz.toUpperCase();
                }
            });
            api.cookies.url({
                foo: 'bar', baz: 'quux'
            }).should.be.equal('/cookies?foo=bar&baz=QUUX');
        });
    });
    
    describe('#scope()', () => {
        var api;

        beforeEach(() => {
            api = new RestClient(host);
            api.res('cookies');
        });

        it('should build correct resource url', () => {
            api.cookies().scope('demo', 'test').url().should.be.equal('/cookies/demo/test');
            api.cookies().scope('demo', 'test', 123).url().should.be.equal('/cookies/demo/test/123');
            api.cookies().scope('demo', 'test', '#foo').url().should.be.equal('/cookies/demo/test/%23foo');
        });
        
        it('should build correct resource url - with params', () => {
            api.cookies().scope('demo', 'test', { foo: 'bar' }).url().should.be.equal('/cookies/demo/test?foo=bar');
            api.cookies().scope('demo', 'test', 123, { foo: 'bar' }).url().should.be.equal('/cookies/demo/test/123?foo=bar');
            api.cookies().scope('demo', 'test', '#foo', { foo: 'bar' }).url().should.be.equal('/cookies/demo/test/%23foo?foo=bar');
        });

        it('should build correct resource instance url', () => {
            api.cookies(42).scope('demo', 'test').url().should.be.equal('/cookies/42/demo/test');
        });
        
        it('should build correct resource instance url - with params', () => {
            api.cookies(42).scope('demo', 'test', { foo: 'bar' }).url().should.be.equal('/cookies/42/demo/test?foo=bar');
        });
        
        it('should build correct resource url if two in stack', () => {
            api.cookies.res('bakers');
            api.cookies(42).scope('demo', 'test').bakers(24).url().should.be.equal('/cookies/42/demo/test/bakers/24');
            api.cookies(42).bakers(24).scope('demo', 'test').url().should.be.equal('/cookies/42/bakers/24/demo/test');
        });
        
        it('should build correct resource url if two in stack - with params', () => {
            api.cookies.res('bakers');
            api.cookies(42).scope('demo', 'test', { foo: 'bar' }).bakers(24).url().should.be.equal('/cookies/42/demo/test/bakers/24?foo=bar');
            api.cookies(42).bakers(24).scope('demo', 'test', { foo: 'bar' }).url().should.be.equal('/cookies/42/bakers/24/demo/test?foo=bar');
        });
        
        it('should build correct resource url if more than two in stack', () => {
            api.cookies.res('bakers').res('cats');
            api.cookies(42).scope('demo', 'test').bakers.cats.url().should.be.equal('/cookies/42/demo/test/bakers/cats');
            api.cookies(42).bakers(24).scope('demo', 'test').cats(15).url().should.be.equal('/cookies/42/bakers/24/demo/test/cats/15');
            api.cookies(42).bakers(24).cats(15).scope('demo', 'test').url().should.be.equal('/cookies/42/bakers/24/cats/15/demo/test');
        });
        
        it('should build correct resource url if more than two in stack - with params', () => {
            api.cookies.res('bakers').res('cats');
            api.cookies(42).scope('demo', 'test', { foo: 'bar' }).bakers.cats.url().should.be.equal('/cookies/42/demo/test/bakers/cats?foo=bar');
            api.cookies(42).bakers(24).scope('demo', 'test', { foo: 'bar' }).cats(15).url().should.be.equal('/cookies/42/bakers/24/demo/test/cats/15?foo=bar');
            api.cookies(42).bakers(24).cats(15).scope('demo', 'test', { foo: 'bar' }).url().should.be.equal('/cookies/42/bakers/24/cats/15/demo/test?foo=bar');
        });
        
        it('should build correct resource url params for multiple scopes (1)', () => {
            api.cookies(42).scope({
                foo: 'bar'
            }).scope({
                baz: 'quux'
            }).url({
                fox: 'beez'
            }).should.be.equal('/cookies/42?foo=bar&baz=quux&fox=beez');
        });
        
        it('should build correct resource url params for multiple scopes (2)', () => {
            api.cookies(42).scope('demo', {
                foo: 'bar'
            }).scope('test', {
                baz: 'quux'
            }).url({
                fox: 'beez'
            }).should.be.equal('/cookies/42/demo/test?foo=bar&baz=quux&fox=beez');
        });
        
        it('should build correct resource url params using a function', () => {
            api.cookies(42).scope('demo', (parent, name, id) => {
                return { name: name.toUpperCase() };
            }).url({
                fox: 'beez'
            }).should.be.equal('/cookies/42/demo?name=DEMO&fox=beez');
        });
        
        it('should build correct resource url params using multiple functions', () => {
            api.cookies(42).scope('demo', (parent, name, id) => {
                return { name: name.toUpperCase() };
            }).scope('test', (parent, name, id) => {
                return { foo: 'bar' };
            }).url({
                fox: 'beez'
            }).should.be.equal('/cookies/42/demo/test?name=DEMO&foo=bar&fox=beez');
        });
        
    });
    
    describe('#use', () => {
        
        beforeEach(() => {
            api = new RestClient(host);
            api.res('users').res('posts');
        });
        
        it('should return a resource (1)', () => {
            let resource = api.use('users');
            resource.should.be.an.object;
            resource.url().should.be.equal('/users');
            resource(4).url().should.be.equal('/users/4');
        });
        
        it('should return a resource (2)', () => {
            let posts = api.use('users').id(4).use('posts');
            posts.should.be.an.object;
            posts.id('new-post-slug').url().should.be.equal('/users/4/posts/new-post-slug');
        });
        
        it('should return a resource (3)', () => {
            let posts = api.use('users', 4, 'posts');
            posts.should.be.an.object;
            posts.url().should.be.equal('/users/4/posts');
        });
        
        it('should return a resource (4)', () => {
            let posts = api.use('users', ['me'], 'posts');
            posts.should.be.an.object;
            posts.url().should.be.equal('/users/me/posts');
        });
        
        it('should return a resource (5)', () => {
            let posts = api.use('users', ['me', { foo: 'bar' }], 'posts');
            posts.should.be.an.object;
            posts.url().should.be.equal('/users/me/posts?foo=bar');
        });
        
    });
    
    describe('#params', () => {
        var api;
    
        beforeEach(() => {
            api = new RestClient(host);
            api.params({ 'sessionId': '1234' });
            api.res('cookies');
        });
        
        it('should set params (1)', () => {
            api.cookies().param('foo', 'bar').url().should.be.equal('/cookies?sessionId=1234&foo=bar');
        });
        
        it('should set params (2)', () => {
            api.cookies().scope('demo', {
                baz: 'quux'
            }).params({
                foo: 'bar'
            }).url().should.be.equal('/cookies/demo?baz=quux&sessionId=1234&foo=bar');
        });
        
        it('should set params (3)', () => {
            api.cookies().scope('demo', {
                baz: 'quux'
            }).params({
                foo: 'bar'
            }).url({
                foo: 'override'
            }).should.be.equal('/cookies/demo?baz=quux&sessionId=1234&foo=override');
        });
    
    });
    
    describe('#headers', () => {
        var api;
    
        beforeEach(() => {
            api = new RestClient(host);
            api.headers({ 'X-Test': 'TEST' });
            api.res('cookies');
        });
        
        it('should send headers (1)', () => {
            var req;
            xhr.onCreate = r => req = r;
            
            api.cookies().header('Authentication', 'TOKEN').get();
            req.url.should.be.equal(host + '/cookies');
            req.requestHeaders['X-Test'].should.be.equal('TEST');
            req.requestHeaders['Authentication'].should.be.equal('TOKEN');
        });
        
        it('should send headers (2)', () => {
            var req;
            xhr.onCreate = r => req = r;
            
            api.cookies().scope('demo').header('Authentication', 'TOKEN').get();
            req.url.should.be.equal(host + '/cookies/demo');
            req.requestHeaders['X-Test'].should.be.equal('TEST');
            req.requestHeaders['Authentication'].should.be.equal('TOKEN');
        });
    
    });
    
    describe('#execute()', () => {
        var api;

        beforeEach(() => {
            api = new RestClient(host);
            api.res('cookies');
        });
        
        it('should use query args when executing GET', () => {
            var req;
            xhr.onCreate = r => req = r;

            api.cookies(4).execute('GET', {}, { foo: 'bar' }, { 'Authentication': 'TOKEN' });
            req.url.should.be.equal(host + '/cookies/4?foo=bar');
            req.requestHeaders['Authentication'].should.be.equal('TOKEN');
        });
        
        it('should use query args when executing POST', (done) => {
            var req;
            xhr.onCreate = r => req = r;

            var respText;

            var p = api.cookies(4).scope('demo', 'test').execute('POST', { baz: 'quux' }, { foo: 'bar' });
            p.on('success', xhr => respText = xhr.responseText);

            setTimeout(() => req.respond(200, [], '{a:1}'), 0);

            req.url.should.be.equal(host + '/cookies/4/demo/test?foo=bar');
            p.then(r => {
                r.should.be.equal('{a:1}');
                respText.should.be.equal('{a:1}');
                req.requestBody.should.be.equal('{"baz":"quux"}');
                done();
            }).catch(done);
        });

    });

    describe('#get()', () => {
        var api;
        
        beforeEach(() => {
            api = new RestClient(host, { mergeParams: false });
            api.res('cookies');
        });

        it('should correct form query args when get one instance (number)', () => {
            var req;
            xhr.onCreate = r => req = r;
        
            api.cookies(4).get();
            req.url.should.be.equal(host + '/cookies/4');
        });
        
        it('should correct form query args when get one instance (string)', () => {
            var req;
            xhr.onCreate = r => req = r;
        
            api.cookies('foo').get();
            req.url.should.be.equal(host + '/cookies/foo');
        });
        
        it('should correct form query args when get multiple instances', () => {
            var req;
            xhr.onCreate = r => req = r;
        
            api.cookies.get({fresh: true});
            req.url.should.be.equal(host + '/cookies?fresh=true');
        });
        
        it('should correct form query args when get multiple args', () => {
            var req;
            xhr.onCreate = r => req = r;
        
            api.cookies.get({'filter[]': 'fresh'}, {'filter[]': 'taste'});
            req.url.should.be.equal(host + '/cookies?filter%5B%5D=fresh&filter%5B%5D=taste');
        });
        
        it('should work correctly with an undefined content type', (done) => {
            var req;
            xhr.onCreate = r => req = r;
        
            var p = api.cookies.get({fresh: true});
        
            setTimeout(() => {
                req.respond(200, [], '{a:1}');
            }, 0);
            
            req.url.should.be.equal(host + '/cookies?fresh=true');
            p.then(r => {
                r.should.be.equal('{a:1}');
                done();
            }).catch(done);
        });
        
        it('should correctly parse response', (done) => {
            var req;
            xhr.onCreate = r => req = r;
        
            var p = api.cookies.get({fresh: true});
            
            setTimeout(() => {
                req.respond(200, {'Content-Type': 'application/json'}, '{"a":"1df"}');
            }, 0);
            
            req.url.should.be.equal(host + '/cookies?fresh=true');
            p.then(r => {
                r.should.be.deep.equal({"a": "1df"});
                done();
            }).catch(done);
        });
        
        it('should correctly handle exception with wrong encoded response body', (done) => {
            var req;
            xhr.onCreate = r => req = r;
        
            var p = api.cookies.get({fresh: true});
        
            setTimeout(() => {
                req.respond(200, {'Content-Type': 'application/json'}, '{"a":1df}');
            }, 0);
            
            req.url.should.be.equal(host + '/cookies?fresh=true');
            p.catch(function(error) {
                error.message.should.equal('Unexpected token d in JSON at position 6');
                error.xhr.status.should.equal(200);
                done();
            });
        });
        
        it('should correctly handle error responses', (done) => {
            var req;
            xhr.onCreate = r => req = r;
        
            var p = api.cookies.get({fresh: true});
        
            setTimeout(() => {
                req.respond(500, {
                    'Content-Type': 'application/json'
                }, '{"error":{"type":"fail","message":"Something went wrong..."}}');
            }, 0);
            
            req.url.should.be.equal(host + '/cookies?fresh=true');
            p.catch(function(error) {
                error.message.should.equal('Something went wrong...');
                error.xhr.status.should.equal(500);
                error.details.should.eql({
                    error: { type: 'fail', message: 'Something went wrong...' }
                });
                done();
            });
        });
        
        it('should emit once event', (done) => {
            var req;
            xhr.onCreate = r => req = r;
        
            var respText;
        
            var p = api.cookies.get({fresh: true}).on('success', xhr => respText = xhr.responseText);
        
            setTimeout(() => req.respond(200, [], '{a:1}'), 0);
        
            req.url.should.be.equal(host + '/cookies?fresh=true');
            p.then(r => {
                r.should.be.equal('{a:1}');
                respText.should.be.equal('{a:1}');
                done();
            }).catch(done);
        });
        
        it('should emit once request event', (done) => {
            var req;
            xhr.onCreate = r => req = r;
        
            var bool;
        
            var p = api.cookies.get({fresh: true}).on('request', xhr => bool = true);
        
            setTimeout(() => req.respond(200, [], '{a:1}'), 0);
        
            req.url.should.be.equal(host + '/cookies?fresh=true');
            p.then(r => {
                bool.should.be.equal(true);
                done();
            }).catch(done);
        });
        
    });
    
});
