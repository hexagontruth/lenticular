class FloatControl {
  constructor(name, initialValue, min, max, step) {
    this.name = name;
    this.value = initialValue;
    this.min = min;
    this.max = max;
    this.step = step || 1;

    this.el = document.createElement('li');
    this.el.classList.add('control');
    this.el.title = this.name;

    this.field = document.createElement('input');
    this.field.type = 'text';
    this.field.value = this.value;

    this.field.oninput = () => {
      this.value = this.validate(this.field.value);
      this.update();
    };

    this.el.appendChild(this.field);

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = this.min;
    this.slider.max = this.max;
    this.slider.step = this.step;
    this.slider.value = this.value;

    this.slider.oninput = () => {
      this.value = this.validate(this.slider.value);
      this.update();
    }

    this.el.appendChild(this.slider);
  }

  validate(val) {
    val = parseFloat(val);
    return isNaN(val) ? this.value : val;
  }

  update() {
    if (parseFloat(this.field.value) != this.value)
      this.field.value = this.value;
    this.slider.value = this.value;
    this.onchange && this.onchange(this);
  }
}
