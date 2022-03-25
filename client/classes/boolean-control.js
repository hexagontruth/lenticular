class BooleanControl {
    constructor(name, initialValue) {
      this.name = name;
      this.value = initialValue;
  
      this.el = document.createElement('li');
      this.el.classList.add('control');
      this.el.title = this.name;

      this.checkbox = document.createElement('input');
      this.checkbox.type = 'checkbox';
      this.checkbox.checked = this.value;
  
      this.checkbox.oninput = () => {
        this.value = this.checkbox.checked;
        this.update();
      }
  
      this.el.appendChild(this.checkbox);
    }
  
    validate(val) {
      return !!val;
    }
  
    update() {
      this.checkbox.checked = this.value;
      this.onchange && this.onchange(this);
    }
  }
  