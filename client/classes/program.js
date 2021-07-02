const PROGRAM_DEFAULTS = {
  dim: 2 ** 12,
  interval: 25,
  duration: 2 ** 40,
  epochs: 6,
  start: 0,
  skip: 1,
  params: {
    gridSize: 360,
  },
  play: true,
};

class Program {
  constructor(...args) {
    this.merge(PROGRAM_DEFAULTS);
    this.resetTasks();
    this.pendingFiles = {};
    this.pendingCallbacks = {};
    this.loadedFiles = {};
    for (let arg of args) {
      if (typeof arg == 'string') {
        this.load(arg);
      }
      else if (typeof arg == 'object') {
        this.merge(arg);
      }
    }
    this.updateSettings();
    this.checkReady();
  }

  merge(obj) {
    this.settings = Util.merge(this.settings || {}, obj);
  }

  updateSettings() {
    if (this.settings?.shaders?.length) {
      this.loadShaders();
    }
  }

  resetTasks() {
    this.taskIdx = 0;
    this.tasks = new Set();
    this.readyFired = false;
  }

  openTask() {
    let id = this.taskIdx ++;
    this.readyFired = false;
    this.tasks.add(id);
    return id;
  }

  closeTask(id) {
    let result = this.tasks.delete(id);
    this.checkReady();
    return result;
  }

  checkReady() {
    if (this.ready && !this.readyFired) {
      this.readyFired = true;
      this.onready && this.onready();
    }
  }

  async load(path) {
    let match = path.match(/^([\w-\/]+)(\.json)?$/);
    if (match)
      path = match[1] + '.json';
    else
      throw new LenticularError(`Invalid program name: ${path}. Too bad.`)
    path = 'data/programs/' + path;
    let t = this.openTask();
    this._ready = false;
    let response = await fetch(path);
    if (response.status != 200)
      throw new LenticularError(response);
    let json = await response.json();
    this.merge(json);
    this.updateSettings();
    this.closeTask(t);
  }

  async loadShaders() {
    let t= this.openTask();

    let paths = this.settings?.shaders || [];
    this.shaderText = Array(paths.lengths);
    await Promise.all(paths.map(async (path, idx) => {
      this.shaderText[idx] = await this.loadShader(path);
    }));

    this.closeTask(t);
  }

  async loadShader(path) {
    // TODO: Load files once plz
    let response = await fetch('data/shaders/' + path);
    if (response.status != 200)
      throw new LenticularError(response);
    let text = await response.text();
    let rows = text.split('\n');
    let chunks = [];
    let chunkStart = 0;
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      let match = row.match(/^\#include ([\w-]+)(\.fs)?$/);
      if (match) {
        if (i > chunkStart)
          chunks.push(rows.slice(chunkStart, i));
        let path = match[1] + '.fs';
        let includeText = await this.loadShader(path);
        chunks.push(includeText.split('\n'));
        chunkStart = i + 1;
      }
    }
    chunks.push(rows.slice(chunkStart));
    return chunks.map((e) => e.join('\n')).join('\n');
  }

  get ready() {
    return this?.tasks?.size == 0
  }
}
