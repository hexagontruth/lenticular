// import CanvasInput from './canvas-input.js';

class NoiseInput extends CanvasInput {
  constructor(page, args = {}) {
    super(page, args);
    let defaults = {
      size: 64,
      style: 'squiggle',
      channels: 3,
      spots: 36,
      spotLength: 8,
    };
    Object.assign(this, defaults, args);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.setSize();
  }

  setSize(size = this.size) {
    const { canvas, ctx } = this;
    size = Array.isArray(size) ? size : [size, size];
    this.size = size;
    [canvas.width, canvas.height] = size;
    this.getNewData();
  }

  clear() {
    // I do not have time to figure out this alpha shit rn
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, ...this.size);
    this.getNewData();
  }

  getNewData() {
    this.data = this.ctx.getImageData(0, 0, ...this.size);
  }

  getIndex(x, y, channel) {
    const [w, h] = this.size;
    x = x % w;
    y = y % h;
    return x * w * 4 + y * 4 + channel;
  }


  set(x, y, channel, v) {
    const idx = this.getIndex(x, y, channel);
    this.data.data[idx] = v;
  }

  get(x, y, channel) {
    const idx = this.getIndex(x, y, channel);
    return this.data.data[idx];
  }

  setNoise() {
    this.style == 'squiggle' && this.setSquiggleNoise();
  }

  setSquiggleNoise() {
    const { ctx, size, channels, spots, spotLength } = this;
    const { random, floor, sign } = Math;
    const on = 255, off = 0;

    const [w, h] = this.size;
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    this.clear(); // Clear canvas and copy new imageData with [0,0,0,1]

    for (let i = 0; i < channels; i++) {
      for (let j = 0; j < spots; j++) {
        let x = floor(random() * w);
        let y = floor(random() * h);
        this.set(x, y, i, on);

        for (let k = 0; k < spotLength - 1; k++) {
          const dir = floor(random() * 4);
          let xo, yo, cur;
          [xo, yo] = dirs[dir];
          for (let m = 0; m < 16; m++) {
            if (this.get(x + xo, y + yo, i) != on)
              break;
            xo *= 2;
            yo *= 2;
          }
          x = x + xo;
          y = y + yo;
          this.set(x, y, i, on);
        }
      }
    }
    ctx.putImageData(this.data, 0, 0);
  }
}
