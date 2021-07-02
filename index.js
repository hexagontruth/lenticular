#!/usr/bin/env node

const process = require('process');
const spawn = require('child_process').spawn;

const Builder = require('./server/builder');
const Server = require('./server/server');
const config = require('./server/config');
const util = require('./server/util');

if (require.main === module) {
  const args = process.argv.slice(2);

  let builder = build(config);

  if (args.includes('start')) {
    serve(config);
    config.env == 'development' && watch(builder);
  }
}

function build(config) {
  const builder = new Builder(config);
  builder.buildAll();
  return builder;
}

function serve(config) {
  const server = new Server(config);
  server.start();
  return server;
}

function watch(builder) {
  spawn('bin/sass.sh', ['--watch'], {stdio: ['pipe', process.stdout, 'pipe']});
  builder.watch();
}

module.exports = { build, serve, watch };
