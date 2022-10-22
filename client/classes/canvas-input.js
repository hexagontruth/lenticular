class CanvasInput {
  constructor(page, args={}) {
    let defaults = {
      canvas: args.canvas || document.createElement('canvas'),
    };
    Object.assign(this, defaults, args);

    this.page = page;
  }

  get textureSrc() {
    return this.canvas;
  }

}
