const PLAYER_DEFAULT_UNIFORMS = {
  images: Array(4).fill(null),
  bufferImage: null,
  sBuffer: null,
  tBuffer: null,
  dBuffer: null,
  inputImage: null,
  lastFrame: null,
  lastBuffer: null,
  size: null,
  nbStates: 7,
  threshold: 2,
  counter: 0,
  duration: 600,
  time: 0,
  epochs: 6,
  fTime: 0,
  fEpoch: 0,
  fEpochFills: Array(6).fill(0),
  gridSize: 360,
  cursor: 0,
  cursorPos: [0, 0],
  cursorLast: [0, 0],
  pi: Math.PI,
  tau: Math.PI * 2,
  phi: (1 + 5 ** 0.5) / 2,
  unit: [1, 0, -1],
  sr2: 2 ** 0.5,
  sr3: 3 ** 0.5,
  ap: (3 ** 0.5) / 2,
  inap: 2 / (3 ** 0.5)
};

class Player {
  constructor(app) {
    this.app = app;
    this.program = app.program;
    this.canvas = app.canvas;
    this.frames = app.frames;
    this.status = app.statusField;
    this.message = app.messageField;
    this.settings = this.program.settings;

    this.settings.transferDim = this.settings.transferDim || this.settings.dim;

    this.canvas.width = this.canvas.height = this.settings.dim;

    this.transferCanvas = document.createElement('canvas');
    this.transferCanvas.width = this.transferCanvas.height = this.settings.transferDim;
    this.transferCtx = this.transferCanvas.getContext('2d');
    this.gl = this.canvas.getContext('webgl2');
    this.pixFmt = this.gl.RGBA;

    this.uniforms = Util.merge({}, PLAYER_DEFAULT_UNIFORMS, this.settings.uniforms);

    this.uniformOverrides = Util.merge(Array(4).fill().map(() => []), this.settings.uniformOverrides || []);
    this.frameCond = (n) => {
      let skipCond = n.counter % this.settings.skip == 0;
      let startCond = n.counter >= this.settings.start;
      let stopCond = this.settings.stop == null || n.counter < this.settings.stop;
      return skipCond && startCond && stopCond;
    }

    this.inputFrameCount = 0;
    this.play = this.settings.play;
    this.recording = false;
    this.videoCapture = null;
    this.videoFrame = null;

    this.cursorDown = false;
    this.intervalTimer = null;

    this.vertText = 
`
#version 300 es
#ifdef GL_ES
precision mediump float;
#endif

in vec2 position;
void main() {
  gl_Position = vec4(position.xy, 0, 1);
}
`;
  }

  setTimer(cond) {
    requestAnimationFrame(() => {
      let interval = this.settings.interval;
      if (this.recording && cond)
        interval = Math.max(this.settings.interval, this.settings.recordingInterval || 0);
      if (interval == 0)
        requestAnimationFrame(fn);
      else
        this.intervalTimer = setTimeout(() => this.animate(), interval);
    });
  }

  togglePlay(val) {
    val = val != null ? val : !this.play;
    this.play = val;
    if (this.play)
      this.animate();
  }

  toggleRecord(val) {
    val = val != null ? val : !this.recording;
    this.recording = val;
    if (val) {
      this.resetCounter();
      fetch('/reset', {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': `text/plain`},
        body: 'ohai i can haz reset plx?'
      });
    }
  }

  resetCounter() {
    this.uniforms.counter = 0;
    this.uniforms.time = 0;
    this.status.value = 0;
    this.initializeUniforms();
    this.play || this.animate();
  }

  async promptDownload() {
    let uri = await this.canvas.toDataURL('image/png', 1);
    let a = document.createElement('a');
    a.href = uri;
    a.download = `frame-${('0000' + this.uniforms.counter).slice(-4)}.png`;
    a.click();
  }

  init() {
    console.log('wedgetown');
    let gl = this.gl;
    this.sBuffer = [];
    this.tBuffer = [];
    this.dBuffer = [];
    this.tIdx = 0;

    this.pixel = new Uint8Array([0x0, 0x0, 0x0,0xff]);

    this.sProgram = twgl.createProgramInfo(gl, [this.vertText, this.program.shaderText[0]]);
    this.tProgram = twgl.createProgramInfo(gl, [this.vertText, this.program.shaderText[1]]);
    this.dProgram = twgl.createProgramInfo(gl, [this.vertText, this.program.shaderText[2]]);
    this.cProgram = twgl.createProgramInfo(gl, [this.vertText, this.program.shaderText[3]]);

    this.quadBuf = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
      }
    });
    this.attachments = [{format: this.pixFmt}];
    this.sBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.sBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.tBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.tBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.dBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.dBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.initializeUniforms();

    this.uniforms.images = Array(4).fill().map((e, i) => {
      let tex = gl.createTexture();
      this.resetTexture(tex, true);
      return tex;
    });

    this.uniforms.inputImage = gl.createTexture();
    this.uniforms.cameraImage = gl.createTexture();

    this.initControls();

    this.resetTexture(this.uniforms.inputImage, true);
    this.resetTexture(this.uniforms.cameraImage, true);

    this.resetCounter();
    this.animate();
  }

  setStream(stream) {
    this.stream = stream;
    if (stream) {
      this.videoCapture = document.createElement('video');
      this.videoCapture.autoplay = true;
      this.videoCapture.srcObject = this.stream;

      let args = {
        dim: this.settings.dim,
        img: this.videoCapture,
        fit: this.app.config.streamFit
      };
      this.videoFrame = new CanvasFrame(this.app, 'videoFrame', args);
      this.videoFrame.loadSrc(this.stream);
    }
    // Remove stream
    else {
      this.videoCapture = null;
      this.videoFrame = null;
      this.resetTexture(this.uniforms.cameraImage, true);
    }
  }

  setStreamFit(val) {
    if (this.videoFrame && this.videoFrame.fit != val) {
      this.videoFrame.fit = val;
      this.videoFrame.clear();
      this.resetTexture(this.uniforms.cameraImage, true);
    }
  }

  initControls() {
    this.controls = [];
    let updateFn = (control) => {
      this.uniforms[control.name] = control.value;
    };
    for (let [key, value] of Object.entries(this.settings.controls || {})) {
      let control = new FloatControl(key, ...value);
      control.onchange = updateFn;
      updateFn(control);
      this.controls.push(control);

    }
    let controlMenu = document.querySelector('.menu-controls');
    controlMenu.innerHTML = '';
    for (let control of this.controls) {
      controlMenu.appendChild(control.el);
    }
  }

  resetTexture(texture, flip=false) {
    let gl = this.gl;
    let img = this.pixel;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
    const level = 0;
    const internalFormat = this.pixFmt;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = this.pixFmt;
    const srcType = gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, border, srcFormat, srcType, img);
  }

  updateVideoFrame() {
    if (!this.videoCapture) return;

  }


  runProgram(program, idx=0) {
    let gl = this.gl;
    gl.useProgram(program.program);
    twgl.setBuffersAndAttributes(gl, program, this.quadBuf);
    let uniforms = Util.merge({}, this.uniforms, this.uniformOverrides[idx]);
    twgl.setUniforms(program, uniforms);
    twgl.drawBufferInfo(gl, this.quadBuf, gl.TRIANGLE_STRIP);
  }

  setTexture(tex, data) {
    let gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.pixFmt, this.pixFmt, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  animate() {
    let gl = this.gl;
    let uniforms = this.uniforms;
    let settings = this.settings;

    let curIdx = this.tIdx;
    let nextIdx = (curIdx + 1) % 2;
    let inputIdx = this.inputFrameCount == 0 ? 0 : uniforms.counter % this.inputFrameCount;
    this.tIdx = nextIdx;

    uniforms.cursor = this.cursorDown ? uniforms.cursor + 1 : 0;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    uniforms.size = [gl.drawingBufferWidth, gl.drawingBufferHeight];

    this.uniforms.images.forEach((e, i) => {
      this.setTexture(e, this.frames[i].canvas);
    });
    if (this.inputFrames?.[inputIdx])
      this.setTexture(this.uniforms.inputImage, this.inputFrames[inputIdx].canvas);
    if (this.videoFrame)
      this.setTexture(this.uniforms.cameraImage, this.videoFrame.canvas);


    uniforms.lastFrame = this.tBuffer[curIdx].attachments[0];

    uniforms.sNew = this.sBuffer[nextIdx].attachments[0];
    uniforms.tNew = this.tBuffer[nextIdx].attachments[0];
    uniforms.dNew = this.dBuffer[nextIdx].attachments[0];

    uniforms.sBuffer = this.sBuffer[curIdx].attachments[0];
    uniforms.tBuffer = this.tBuffer[curIdx].attachments[0];
    uniforms.dBuffer = this.dBuffer[curIdx].attachments[0];

    uniforms.bufferImage = this.sBuffer[curIdx].attachments[0];
    uniforms.lastFrame = this.tBuffer[curIdx].attachments[0];
    uniforms.lastBuffer = this.sBuffer[curIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sBuffer[nextIdx].framebuffer);
    this.runProgram(this.sProgram, 0);

    uniforms.bufferImage = this.sBuffer[nextIdx].attachments[0];
    uniforms.lastBuffer = this.tBuffer[curIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.tBuffer[nextIdx].framebuffer);
    this.runProgram(this.tProgram, 1);

    uniforms.bufferImage = this.tBuffer[nextIdx].attachments[0];
    uniforms.lastFrame = this.dBuffer[curIdx].attachments[0];
    uniforms.lastBuffer = this.dBuffer[curIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dBuffer[nextIdx].framebuffer);
    this.runProgram(this.dProgram, 2);

    uniforms.bufferImage = this.dBuffer[nextIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.runProgram(this.cProgram, 3);

    this.status.value = uniforms.counter;
    this.endFrame();
    uniforms.counter += 1;
    uniforms.time = (uniforms.counter / uniforms.duration) % 1;
    uniforms.fTime = (uniforms.time * settings.epochs) % 1;
    uniforms.fEpoch = Math.floor(uniforms.time * settings.epochs);
    uniforms.fEpochFills = Array(settings.epochs);
    for (let i = 0; i < settings.epochs; i++) {
      let a = Math.min(Math.max(uniforms.fEpoch - i, 0), 1)
      if (uniforms.fEpoch == i)
        a += uniforms.fTime;
      uniforms.fEpochFills[i] = a;
    }
  }

  async endFrame() {
    let cond = this.frameCond(this.uniforms)
    if (this.recording && cond) {
      this.transferCtx.drawImage(this.canvas, 0, 0, this.settings.transferDim, this.settings.transferDim);
      let dataUrl = await this.transferCanvas.toDataURL('image/png', 1);
      this.postFrame(dataUrl);
    }
    this.play && this.setTimer(cond);
  }

  initializeUniforms() {
    this.clearTexture([].concat(this.sBuffer, this.tBuffer, this.dBuffer));
  }

  clearTexture(txs) {
    let gl = this.gl;
    let w = gl.drawingBufferWidth;
    let h = gl.drawingBufferHeight;
    let len = w * h * 4;
    let data = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      data[i] = 0; //Math.random() * uniforms.nbStates;
    }
    for (let texture of txs) {
      gl.bindTexture(gl.TEXTURE_2D, texture.attachments[0]);
      gl.texImage2D(gl.TEXTURE_2D, 0, this.pixFmt, w, h, 0, this.pixFmt, gl.UNSIGNED_BYTE, data);
    }
  }

  async postFrame(dataUrl) {
    try {
      await fetch('/', {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': `text/plain`},
        body: dataUrl
      });
    }
    catch (err) {
      console.error(err);
    }
  }

  async loadImages() {
    let imageList = await this.getInputList();
    let len = imageList.length;
    let tasks = [];

    // Create and load frames. TODO: Without canvases?
    this.inputFrames = Array(len).fill().map((e, i) => {
      let frame = new CanvasFrame(this.app, 'inputFrame' + i, {dim: this.settings.dim});
      frame.loadSrc('/input/' + imageList[i]);
      let task = new Promise((resolve, reject) => {
        frame.onload = () => {
          resolve();
        };
      });
      tasks.push(task);
      return frame;
    });

    await Promise.all(tasks);
    this.inputFrameCount = len;
    this.setMessage(`Loaded ${tasks.length} images lol`);
  }

  async getInputList() {
    return await fetch('/input')
      .then((response) => response.json())
      .catch((err) => console.error(err));
  }

  setMessage(msg) {
    this.message.innerHTML = msg;
    this.message.classList.add('visible');
    this.messageTimer = setTimeout(() => {
      this.message.classList.remove('visible');
    }, 5000);
  }
}
