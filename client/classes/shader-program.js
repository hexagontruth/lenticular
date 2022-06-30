class ShaderProgram {
  constructor(player, vertText, fragText) {
    console.log('Creating shader program...');
    this.player = player;
    this.dim = player.settings.dim;
    this.gl = player.gl;
    this.fragText = fragText;
    let gl = this.gl;
    // fragText.split('\n').forEach((e) => console.log('curd'));
    // console.log(vertText, fragText);
    this.vertShader = gl.createShader(gl.VERTEX_SHADER);
    this.fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.vertShader, vertText);
    gl.shaderSource(this.fragShader, fragText);
    gl.compileShader(this.vertShader);
    gl.compileShader(this.fragShader);
    gl.getShaderParameter(this.vertShader, gl.COMPILE_STATUS) || this.error(gl.getShaderInfoLog(this.vertShader));
    gl.getShaderParameter(this.fragShader, gl.COMPILE_STATUS) || this.error(gl.getShaderInfoLog(this.fragShader));
    this.program = gl.createProgram();
    gl.attachShader(this.program, this.vertShader);
    gl.attachShader(this.program, this.fragShader);
    gl.linkProgram(this.program);

    this.vertArray = new Float32Array([
      -1, -1, 0,
      1, -1, 0,
      -1, 1, 0,
      1, 1, 0,
    ]);

    this.textures = [];
    this.framebuffers = [];
    for (let i = 0; i < 2; i++) {
      let texture = gl.createTexture();
      let fb = gl.createFramebuffer();
      this.textures.push(texture);
      this.framebuffers.push(fb);
    };

    for (let i = 0; i < 2; i++) {
      let [texture, fb] = [this.textures[i], this.framebuffers[i]];
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.dim, this.dim, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    };
  }

  setup() {
    let { gl, program } = this;
    let vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertArray, gl.STATIC_DRAW);

    let vertPositionAttribute = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(vertPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.vertexAttribPointer(vertPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  }

  setUniforms(uniforms) {
    let { gl, program } = this;
    let textureIdx = 0;
    gl.useProgram(this.program);
    for (let [key, value] of Object.entries(uniforms)) {
      if (value == null) continue;
      let idx = gl.getUniformLocation(program, key);
      if (!value.length) {
        value = [value];
      }
      let length = value.length;
      if (length > 4) {
        length = 1;
      }
      let type = typeof value[0] == 'boolean' ? 'i' : 'f';
      let fnKey = 'uniform%1%2v'.replace('%1', length).replace('%2', type);
      if (value[0] instanceof WebGLTexture) {
        let textures = value;
        value = textureIdx;
        fnKey = 'uniform1i';
        for (let texture of textures) {
          this.setTexture(key, texture, textureIdx++);
        }
      }
      gl[fnKey](idx, value);
    }
  }

  setTexture(name, texture, idx) {
    let { gl } = this;
    let enumKey = 'TEXTURE%'.replace('%', idx);
    let uniformLoc = gl.getUniformLocation(this.program, name);
    gl.activeTexture(gl[enumKey]);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  clearTextures() {
    let { gl } = this;
    // let data = new Uint8Array(Array(this.dim ** 2 * 4));
    // let data = [];
    // for (let i = 0; i < this.dim ** 2 * 4; i++) {
    //   data.push(0);
    // }
    // data = new Uint8Array(data);
    for (let i = 0; i < 2; i++) {
      let texture = this.textures[i];
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.dim, this.dim, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
  }

  error(msg) {
    window.shaderText = this.fragText;
    throw new LenticularError(msg);
  }
}
