'use strict';

var http = require('http');
var mount = require('..');
var request = require('supertest');
var tianma = require('tianma');

function createApp() {
    var app = tianma();
    var server = http.createServer(app.run);

    app.server = server;

    return app;
}

describe('mount(pathname)', function () {
    function createServer(pathname) {
        var app = createApp();

        app.use(mount(pathname)).then
            .use(function *(next) {
                this.response.data([
                    this.request.base,
                    '\n',
                    this.request.pathname
                ]);
            });

        return app.server;
    }

    it('should mount at /', function (done) {
        request(createServer('/'))
            .get('/foo/bar')
            .expect('\n/foo/bar')
            .end(done);
    });

    it('should mount at /foo', function (done) {
        request(createServer('/foo'))
            .get('/foo/bar/')
            .expect('/foo\n/bar/')
            .end(done);
    });

    it('should mount at /foo/bar', function (done) {
        request(createServer('/foo/bar'))
            .get('/foo/bar/')
            .expect('/foo/bar\n/')
            .end(done);
    });

    it('should reject the unmatched pathname', function (done) {
        request(createServer('/foo'))
            .get('/bar')
            .expect('')
            .end(done);
    });
});

describe('mount(hostname)', function () {
    function createServer(hostname) {
        var app = createApp();

        app.use(mount(hostname)).then
            .use(function *(next) {
                this.response.data(this.request.hostname);
            });

        return app.server;
    }

    it('should mount at localhost', function (done) {
        request(createServer('localhost'))
            .get('/')
            .set('Host', 'localhost')
            .expect('localhost')
            .end(done);
    });

    it('should mount at example.com', function (done) {
        request(createServer('example.com'))
            .get('/')
            .set('Host', 'example.com')
            .expect('example.com')
            .end(done);
    });

    it('should accept sub domain', function (done) {
        request(createServer('example.com'))
            .get('/')
            .set('Host', 'www.example.com')
            .expect('www.example.com')
            .end(done);
    });

    it('should reject the unmatched domain', function (done) {
        request(createServer('localhost'))
            .get('/')
            .set('Host', 'www.example.com')
            .expect('')
            .end(done);
    });
});

describe('mount(hostname/pathname)', function () {
    function createServer(rule) {
        var app = createApp();

        app.use(mount(rule)).then
            .use(function *(next) {
                this.response.data([
                    this.request.hostname,
                    '\n',
                    this.request.base,
                    '\n',
                    this.request.pathname
                ]);
            });

        return app.server;
    }

    it('should mount at ""', function (done) {
        request(createServer())
            .get('/foo/bar')
            .set('Host', 'localhost')
            .expect('localhost\n\n/foo/bar')
            .end(done);
    });

    it('should mount at "localhost/foo/"', function (done) {
        request(createServer('localhost/foo/'))
            .get('/foo/bar')
            .set('Host', 'localhost')
            .expect('localhost\n/foo\n/bar')
            .end(done);
    });

    it('should reject the unmatched domain', function (done) {
        request(createServer('localhost/foo/'))
            .get('/')
            .set('Host', 'my-localhost')
            .expect('')
            .end(done);
    });

    it('should reject the unmatched pathname', function (done) {
        request(createServer('localhost/foo/'))
            .get('/foo-bar')
            .set('Host', 'localhost')
            .expect('')
            .end(done);
    });
});

describe('mount(pathname, pathname)', function () {
    function createServer(rule1, rule2) {
        var app = createApp();

        app.use(mount(rule1, rule2)).then
            .use(function *(next) {
                this.response.data(this.request.pathname);
            });

        return app.server;
    }

    it('should accept the first', function (done) {
        request(createServer('/foo', '/bar'))
            .get('/foo/x')
            .expect('/x')
            .end(done);
    });

    it('should fallback to the second', function (done) {
        request(createServer('/foo', '/bar'))
            .get('/bar/y')
            .expect('/y')
            .end(done);
    });
});

describe('mount([ hostname, hostname ])', function () {
    function createServer(rules) {
        var app = createApp();

        app.use(mount(rules)).then
            .use(function *(next) {
                this.response.data(this.request.hostname);
            });

        return app.server;
    }

    it('should accept the first', function (done) {
        request(createServer([ 'maru', 'mono' ]))
            .get('/')
            .set('Host', 'maru')
            .expect('maru')
            .end(done);
    });

    it('should fallback to the second', function (done) {
        request(createServer([ 'maru', 'mono' ]))
            .get('/')
            .set('Host', 'mono')
            .expect('mono')
            .end(done);
    });
});

describe('url revert', function () {
    it('should restore the original url in bubble up phase', function (done) {
        var app = createApp();

        app
            .use(function *(next) {
                yield next;
                this.response.data(this.request.pathname + this.response.data());
            })
            .use(mount('/foo')).then
                .use(function *(next) {
                    this.response.data(this.request.base);
                })
                .end;

        request(app.server)
            .get('/foo/bar')
            .expect('/foo/bar/foo')
            .end(done);
    });

    it('should behave correct in multi-level mounting', function (done) {
        var app = createApp();

        app
            .use(mount('/foo')).then
                .use(function *(next) {
                    yield next;
                    this.response.data(this.request.base + this.response.data());
                })
                .use(mount('/bar')).then
                    .use(function *(next) {
                        this.response.data(this.request.base);
                    })
                    .end
                .end;

        request(app.server)
            .get('/foo/bar/baz')
            .expect('/foo/bar')
            .end(done);
    });
});
