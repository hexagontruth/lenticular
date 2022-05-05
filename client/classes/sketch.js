class Sketch {
  constructor(program, text) {
    this.program = program;
    this.text = text;
  }

  init(frame) {
    this.frame = frame;
    this.canvas = frame.canvas;
    this.ctx = frame.ctx;
    this.width = frame.dim[0];
    this.height = frame.dim[1];
    this.rectArgs = [
      -this.width/2,
      -this.height/2,
      this.width,
      this.height
    ];

    let fn = Function('sketch', this.text);
    fn(this);
    this.setup = this.setup || (() => null);
    this.draw = this.draw || (() => null);
  }

  clear() {
    this.ctx.clearRect(...this.rectArgs);
  }

  fill(color) {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.rect(...this.rectArgs);
    this.ctx.fill();
    this.ctx.restore();
  }
}
