const PLAYER_DEFAULT_UNIFORMS = {
  images: Array(4).fill(null),
  bufferImage: null,
  sBuffer: null,
  tBuffer: null,
  dBuffer: null,
  lastFrame: null,
  size: null,
  nbStates: 7,
  threshold: 2,
  counter: 0,
  duration: 120,
  time: 0,
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
};

class Player {
  constructor(program, canvas, frames, status) {
    this.program = program;
    this.settings = this.program.settings;
    this.canvas = canvas;
    canvas.width = canvas.height = this.settings.dim;

    this.transferCanvas = document.createElement('canvas');
    this.transferCanvas.width = this.transferCanvas.height = this.settings.dim;
    this.transferCtx = this.transferCanvas.getContext('2d');
    this.gl = this.canvas.getContext('webgl2');

    this.frames = frames;
    this.uniforms = Util.merge({}, PLAYER_DEFAULT_UNIFORMS);
    this.frameCond = (n) => n.counter % this.settings.skip == 0 && n.counter > this.settings.start;

    this.status = status;
    this.recording = false;

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

  togglePlay(v) {
    v = v == null ? !this.settings.play : v;
    this.settings.play = v;
    if (this.settings.play)
      this.animate();
  }

  resetCounter() {
    this.uniforms.counter = 0;
    this.uniforms.time = 0;
    this.status.value = 0;
    this.initializeUniforms();
    this.settings.play || this.animate();
  }

  async promptDownload() {
    let uri = await this.canvas.toDataURL('image/png', 1);
    let a = document.createElement('a');
    a.href = uri;
    a.download = `frame-${('0000' + this.uniforms.counter).slice(-4)}.png`;
    a.click();
  }

  init() {
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
    this.attachments = [{format: gl.RGBA}];
    this.sBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.sBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.tBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.tBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.dBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.dBuffer.push(twgl.createFramebufferInfo(gl, this.attachments));
    this.initializeUniforms();

    this.uniforms.images = Array(4).fill().map((e, i) => {
      let tex = gl.createTexture();
      this.resetTexture(tex);
      return tex;
    });

    this.resetCounter();
    this.animate();
  }

  resetTexture(texture, img=this.pixel) {
    let gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, border, srcFormat, srcType, img);
  }


  runProgram(program) {
    let gl = this.gl;
    gl.useProgram(program.program);
    twgl.setBuffersAndAttributes(gl, program, this.quadBuf);
    twgl.setUniforms(program, this.uniforms);
    twgl.drawBufferInfo(gl, this.quadBuf, gl.TRIANGLE_STRIP);
  }

  setTexture(tex, data) {
    let gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
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
    this.tIdx = nextIdx;

    uniforms.cursor = this.cursorDown ? uniforms.cursor + 1 : 0;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    uniforms.size = [gl.drawingBufferWidth, gl.drawingBufferHeight];

    this.uniforms.images.forEach((e, i) => {
      this.setTexture(e, this.frames[i].canvas);
    });


    uniforms.lastFrame = this.tBuffer[curIdx].attachments[0];

    uniforms.sBuffer = this.sBuffer[curIdx].attachments[0];
    uniforms.tBuffer = this.tBuffer[curIdx].attachments[0];
    uniforms.dBuffer = this.dBuffer[curIdx].attachments[0];

    uniforms.bufferImage = this.sBuffer[curIdx].attachments[0];
    uniforms.lastFrame = this.tBuffer[curIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sBuffer[nextIdx].framebuffer);
    this.runProgram(this.sProgram);

    uniforms.bufferImage = this.sBuffer[nextIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.tBuffer[nextIdx].framebuffer);
    this.runProgram(this.tProgram);

    uniforms.bufferImage = this.tBuffer[nextIdx].attachments[0];
    uniforms.lastFrame = this.dBuffer[curIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dBuffer[nextIdx].framebuffer);
    this.runProgram(this.dProgram);

    uniforms.bufferImage = this.dBuffer[nextIdx].attachments[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.runProgram(this.cProgram);

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
      this.transferCtx.drawImage(this.canvas, 0, 0, this.settings.dim, this.settings.dim);
      let dataUrl = await this.transferCanvas.toDataURL('image/png', 1);
      this.postFrame(dataUrl);
    }
    this.settings.play && this.setTimer(cond);
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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
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
}
