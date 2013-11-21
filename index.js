"use strict";

var path                = require('path');
var browserify          = require('browserify');
var watchify            = require('watchify');
var reactify            = require('reactify');
var aggregate           = require('stream-aggregate-promise');
var getCallsiteDirname  = require('get-callsite-dirname');

/**
 * Serve bundler
 */
function serve(bundler, opts) {
  if (bundler && !bundler.isBundler)
    bundler = create(bundler, opts);

  return function(req, res, next) {
    bundler().then(function(bundle) {
      res.setHeader('Content-type', 'application/javascript');
      res.write(bundle);
      res.end();
    }, next);
  }
}

/**
 * Create a new bundler
 *
 * @param {String|Browserify} entry an entry module id or browserify instance
 * @param {Object} opts
 * @return {Function} function which returns promise of bundle
 */
function create(entry, opts) {
  opts = opts || {};
  opts.logger = opts.logger || require('quiet-console');

  var bundle;
  var root = opts.root || getCallsiteDirname();

  var b = isBrowserify(entry) ?
    entry :
    browserify()
      .transform(reactify)
      .require(entry, {expose: './app', basedir: root});

  if (opts.watch) {
    var w = watchify(b);
    w.on('update', build);
  }

  build();

  var bundler = function() {
    if (bundle === undefined)
      build();
    return bundle;
  }
  bundler.isBundler = true;

  return bundler;

  function build(filename) {
    var start = new Date();

    if (filename) {
      opts.logger.info('change detected in', path.relative(root, filename[0]));
    }

    bundle = aggregate(b.bundle({debug: opts.debug}));
    bundle.then(function() {
      opts.logger.info('bundle built in', new Date() - start, 'ms');
    })
  }
}

/**
 * Check if object is a browserify instance
 */
function isBrowserify (x) {
    return x && typeof x === 'object' && typeof x.bundle === 'function';
}

module.exports = serve;
module.exports.create = create;
module.exports.serve = serve;
