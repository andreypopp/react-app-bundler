var assert      = require('assert');
var path        = require('path');
var express     = require('express');
var req         = require('supertest');
var browserify  = require('browserify');
var bundler     = require('../index');

function fixture(name) {
  return path.join(__dirname, 'fixtures', name);
}

describe('bundler', function() {

  it('can be created from module id', function(done) {
    var b = bundler.create(fixture('index.js'));
    b().then(function(bundle) {
      done();
    }, done);
  });

  it('can be created from browserify instance', function(done) {
    var b = bundler.create(browserify().require(fixture('index.js')));
    b().then(function(bundle) {
      done();
    }, done);
  });
});

describe('bundler middleware', function() {

  var app;

  beforeEach(function() {
    app = express();
  });

  function get() {
    return req(app)
      .get('/bundle.js')   
      .expect(200)
      .expect('Content-type', 'application/javascript');
  }

  it('can be served from module id', function(done) {
    app.use('/bundle.js', bundler.serve(fixture('index.js')));
    get()
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('can be served from browserify instance', function(done) {
    var br = browserify().require(fixture('index.js'));
    app.use('/bundle.js', bundler.serve(br));
    get()
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('can be served from bundle instance', function(done) {
    var bu = bundler.create(fixture('index.js'));
    app.use('/bundle.js', bundler.serve(bu));
    get()
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});
