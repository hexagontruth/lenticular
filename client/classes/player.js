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
    console.log('Creating player...');
    this.app = app;
    this.program = app.program;
    this.shaderCount = this.program.shaderCount;
    this.canvas = app.canvas;
    this.frames = [];
    this.status = app.statusField;
    this.message = app.messageField;
    this.settings = this.program.settings;

    this.sketches = this.program.sketches || [];

    this.settings.dim = this.app.overrideDim || this.settings.dim;

    this.settings.transferDim = this.app.overrideTransferDim || this.settings.transferDim || this.settings.dim;

    this.overrideCounter = this.app.overrideCounter || 0;

    this.canvas.width = this.canvas.height = this.settings.dim;

    this.transferCanvas = document.createElement('canvas');
    this.transferCanvas.width = this.transferCanvas.height = this.settings.transferDim;
    this.transferCtx = this.transferCanvas.getContext('2d');
    this.gl = this.canvas.getContext('webgl2', {preserveDrawingBuffer: this.settings.preserveDrawingBuffer});
    this.gl.getExtension('EXT_color_buffer_float');

    this.pixFmt = this.gl.RGBA;
    this.internalFmt = this.gl.RGBA; // TODO: Figure this out

    this.uniforms = Util.merge({}, PLAYER_DEFAULT_UNIFORMS, this.settings.uniforms);
    this.uniformOverrides = Util.merge(Array(this.shaderCount.length).fill().map(() => []), this.settings.uniformOverrides || []);

    this.gl.viewport(0, 0, this.settings.dim, this.settings.dim);
    this.uniforms.size = [this.settings.dim, this.settings.dim];

    this.settings.stop = this.settings.stop === true ? this.uniforms.duration + this.settings.start || 0 : this.settings.stop;

    this.frameCond = (n) => {
      let skipCond = n.counter % this.settings.skip == 0;
      let startCond = n.counter >= this.settings.start;
      let stopCond = this.settings.stop == null || n.counter < this.settings.stop;
      return skipCond && startCond && stopCond;
    }

    this.noiseInput = new NoiseInput(this, this.settings.noise);

    this.inputFrameCount = 0;
    this.play = this.app.play && this.settings.play;
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
`.trim();
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
    val && this.resetCounter();
    if (this.app.config.recordVideo) {
      if (val) {
        fetch('/video/start', {
          method: 'POST',
          mode: 'no-cors',
          headers: {'Content-Type': `text/plain`},
          body: 'start teh video plz'
        });
      }
      else {
        fetch('/video/end', {
          method: 'POST',
          mode: 'no-cors',
          headers: {'Content-Type': `text/plain`},
          body: 'stop teh video plz kthxbai'
        });
      }
    }
  }

  setRecordImages() {
    let val = this.app.config.recordImages;
    if (val) {
      fetch('/images/start', {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': `text/plain`},
        body: 'record image files plz'
      });
    }
    else {
      fetch('/images/end', {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': `text/plain`},
        body: 'stop recording image files plz'
      });
    }
  }

  resetCounter() {
    this.uniforms.counter = this.overrideCounter;
    this.uniforms.time = 0;
    this.status.value = 0;
    this.clearProgramTextures();
    this.noiseInput.setNoise(this.settings.noise);
    this.setTexture(this.uniforms.noiseTexture, this.noiseInput.canvas);
    this.play || this.animate();
  }

  async promptDownload() {
    let uri = await this.getTransferUrl();
    let a = document.createElement('a');
    a.href = uri;
    window.test = uri;
    a.download = `frame-${('0000' + (this.uniforms.counter - 1)).slice(-4)}.png`;
    a.click();
  }

  init() {
    console.log('Initializing player...');
    let { gl } = this;

    // This is terrible
    this.frames = this.app.frames.map((e, i) => {
        let frame = new CanvasFrame(this, 'canvas' + i, {
          canvas: e,
          dim: this.settings.sketchDim || this.settings.dim
        });
        e.ondblclick = () => frame.loadImageFromPrompt();
        return frame;
      });

    this.shaderPrograms = this.program.shaderText.map((fragText) => {
      let shaderProgram = new ShaderProgram(this, this.vertText, fragText);
      shaderProgram.setup();
      return shaderProgram;
    });

    this.tIdx = 0;

    this.pixel = new Uint8Array([0x0, 0x0, 0x0,0xff]);

    this.uniforms.images = Array(4).fill().map((e, i) => {
      let tex = gl.createTexture();
      this.resetTexture(tex, true);
      return tex;
    });

    this.uniforms.inputImage = gl.createTexture();
    this.uniforms.streamImage = gl.createTexture();
    this.uniforms.noiseTexture = gl.createTexture();
    this.resetTexture(this.uniforms.inputImage, true);
    this.resetTexture(this.uniforms.streamImage, true);
    this.resetTexture(this.uniforms.noiseTexture, true);
    this.uniforms.lastTextures = Array(this.shaderCount - 1).fill();
    this.uniforms.nextTextures = Array(this.shaderCount - 1).fill();

    this.initControls();

    this.resetCounter();

    this.sketches.forEach((sketch, idx) => {
      sketch.init(this.frames[idx]);
      sketch.setup();
    });

    this.play && this.animate();
  }

  setStream(stream) {
    let oldStream = this.stream;
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
      if (oldStream) {
        oldStream.getTracks().forEach((track) => {
          track.readyState == 'live' && track.stop();
        });
      }
      this.videoCapture = null;
      this.videoFrame = null;
      this.resetTexture(this.uniforms.streamImage, true);
    }
  }

  setStreamFit(val) {
    if (this.videoFrame && this.videoFrame.fit != val) {
      this.videoFrame.fit = val;
      this.videoFrame.clear();
      this.resetTexture(this.uniforms.streamImage, true);
    }
  }

  initControls() {
    this.controls = [];
    let updateFn = (control) => {
      this.uniforms[control.name] = control.value;
    };
    for (let [key, value] of Object.entries(this.settings.controls || {})) {
      let control;
      if (value.length == 4)
        control = new FloatControl(key, ...value);
      else if (value.length == 1)
        control = new BooleanControl(key, ...value);
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
    const width = 1;
    const height = 1;
    const border = 0;
    gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFmt, width, height, border, this.pixFmt, gl.UNSIGNED_BYTE, img);
  }

  setTexture(tex, data) {
    let { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFmt, this.pixFmt, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  animate() {
    let { gl, uniforms, settings, shaderCount, shaderPrograms } = this;

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

    let lastIdx = this.tIdx;
    let nextIdx = (lastIdx + 1) % 2;
    let inputIdx = this.inputFrameCount == 0 ? 0 : uniforms.counter % this.inputFrameCount;
    this.tIdx = nextIdx;

    uniforms.cursor = this.cursorDown ? uniforms.cursor + 1 : 0;
    uniforms.clock = (Date.now()/1000) % 60;

    uniforms.images.forEach((e, i) => {
      this.sketches[i] && this.sketches[i].draw({
        counter: uniforms.counter,
        duration: uniforms.duration,
        time: uniforms.time
      });
      this.setTexture(e, this.frames[i].canvas);
    });
    if (this.inputFrameCount && this.inputFrames?.[inputIdx])
      this.setTexture(uniforms.inputImage, this.inputFrames[inputIdx].canvas);
    if (this.videoFrame)
      this.setTexture(uniforms.streamImage, this.videoFrame.canvas);

    for (let i = 0; i < this.shaderCount - 1; i++) {
      // TODO: Fix arrays
      uniforms.lastTextures[i] = shaderPrograms[i]?.textures[lastIdx];
      uniforms.nextTextures[i] = shaderPrograms[i]?.textures[nextIdx];
      uniforms[`lastTexture${i}`] = shaderPrograms[i]?.textures[lastIdx];
      uniforms[`nextTexture${i}`] = shaderPrograms[i]?.textures[nextIdx];
    }
    // Backwards compatibility with the unfortunately-named s/t/d pipeline (it made some sense at the time)

    uniforms.sNew = shaderPrograms[0]?.textures[nextIdx];
    uniforms.tNew = shaderPrograms[1]?.textures[nextIdx];
    uniforms.dNew = shaderPrograms[2]?.textures[nextIdx];

    uniforms.sBuffer = shaderPrograms[0]?.textures[lastIdx];
    uniforms.tBuffer = shaderPrograms[1]?.textures[lastIdx];
    uniforms.dBuffer = shaderPrograms[2]?.textures[lastIdx];
    // console.log(uniforms.time, uniforms.counter);
    shaderPrograms.forEach((shaderProgram, i) => {
      let li = (i + shaderCount - 1) % shaderCount;
      let lastTexture = shaderPrograms[i].textures[lastIdx];
      let inputTexture = shaderPrograms[li].textures[nextIdx];

      if (shaderCount > 1 && i == 0) {
        inputTexture = shaderPrograms[shaderCount - 2].textures[lastIdx];
      }
      uniforms.lastTexture = lastTexture;
      uniforms.inputTexture = inputTexture;

      // More backwards compatibility stuff
      uniforms.bufferImage = inputTexture;
      uniforms.lastFrame = lastTexture;
      uniforms.lastBuffer = lastTexture; // Idk what this was supposed to be?

      uniforms.programIdx = i;

      shaderProgram.setUniforms(uniforms);
      let framebuffer = i < shaderCount - 1 ? shaderPrograms[i].framebuffers[nextIdx] : null;
      gl.useProgram(shaderProgram.program);
      gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });

    this.status.value = uniforms.counter;
    this.endFrame(uniforms.counter);
    uniforms.counter += 1;
  }

  async endFrame(frameIdx) {
    let cond = this.frameCond(this.uniforms)
    if (this.recording && cond) {
      let dataUrl = await this.getTransferUrl();
      this.postFrame(dataUrl, frameIdx);
    }
    this.play && this.setTimer(cond);
  }

  async getTransferUrl() {
    this.transferCtx.drawImage(this.canvas, 0, 0, this.settings.transferDim, this.settings.transferDim);
    let dataUrl = await this.transferCanvas.toDataURL('image/png', 1);
    return dataUrl;
  }

  clearProgramTextures() {
    this.shaderPrograms.forEach((e) => e.clearTextures());
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
      gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, w, h, 0, this.pixFmt, gl.UNSIGNED_BYTE, data);
    }
  }

  async postFrame(dataUrl, frameIdx) {
    try {
      await fetch(`/frame/${frameIdx}`, {
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

    this.inputFrameCount = 0;
    this.inputFrames = [];

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
