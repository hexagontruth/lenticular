const fs = require('fs');
const http = require('http');
const pth = require('path');
const {spawn, execSync} = require('child_process');

const express = require('express');

const util = require('./util');

// ---

class Server {
  constructor(config) {
    this.app = express();
    this.config = util.merge({}, config);
    this.resetIndex();
    this.idxChars = this.config.imageFilename.match(/\#+/)[0].length;

    execSync(`mkdir -p ${this.config.output} ${this.config.input}`);

    this.app.use(express.static('./public'));
    this.app.use('/data', express.static('./library'));
    this.app.use('/data', express.static('./user'));
    this.app.get('/input', async (req, res) => {
      let inputFiles = await util.readdir(util.join(this.config.input));
      res.end(JSON.stringify(inputFiles));
    });
    this.app.get('/input/:inputFile', async (req, res) => {
      let file = await util.readFile(util.join(this.config.input, req.params.inputFile));
      let mime = util.mimeFromBuffer(file);
      console.log(mime);
      // ext =
      //   num == 0x47 ? 'imag/gif' :
      //   num ==
      res.end(file);
    });
    this.app.post('/reset', (req, res) => {
      this.resetIndex();
      res.end('sure lol');
    })
    this.app.post('/', (req, res) => {
      this.processData(req);
      res.end('lgtm');
    });
  }

  resetIndex() {
    this.idx = this.config.imageStartIndex;
  }

  start() {
    this.config.saveVideo && this.startEncoder();

    this.app.listen(this.config.port, () => {
      console.log(`Listening on port ${this.config.port} lol...`);
    });
    process.on('SIGINT', () => {
      if (this.child) {
        this.child.stdin.end();
        this.child.on('exit', () => {
          console.log('Exiting thing...');
          process.exit();
        });
      }
      else {
        process.exit();
      }
    });
  }

  startEncoder() {
    let args = [
      '-y',
      '-c:v', 'png',
      '-r', `${this.config.fps}`,
      '-f', 'image2pipe',
      '-i', '-',
      '-pix_fmt', 'yuv420p',

      '-vf', `scale=${this.config.width}x${this.config.height}`,
      '-c:v', this.config.codec,
      '-crf', `${this.config.crf}`,
      pth.join(this.config.output, this.config.videoFilename),
    ];
    this.child = spawn('ffmpeg', args, {stdio: ['pipe', 'pipe', 'pipe']});
    this.child.on('exit', () => console.log('Exiting encoder...'));
    this.child.stdout.on('data', (data) => {
      console.log(`ENCODER: ${data}`);
    });
    this.child.stderr.on('data', (data) => {
      console.error(`ENCODER: ${data}`);
    });
  }

  async processData(req) {
    let data = '';
    req.on('data', (chunk) => data += chunk);
    req.on('end', () => {
      let match = data.match(/:([\w\/]+);/);
      let ext = this.config.mimeTypes[match[1]];
      let base64 = data.slice(data.indexOf(',') + 1);
      let buf = Buffer.from(base64, 'base64');
      if (this.config.saveImages) {
        let filepath = pth.join(this.config.output, this.config.imageFilename + ext);
        let idxString = ('0'.repeat(this.idxChars) + (this.idx ++)).slice(-this.idxChars);
        filepath = filepath.replace(/\#+/, idxString);
        console.log(`Writing "${filepath}"...`)
        fs.writeFileSync(filepath, buf);
      }
      if (this.config.saveVideo) {
        this.child.stdin.write(buf);
      }
    });
  }
}

module.exports = Server;
