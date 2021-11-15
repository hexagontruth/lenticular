let CONF_PATH;

CONF_PATH = 'raymarch-example';

const canvas = document.querySelector('#thecanvas');
const recordButton = document.querySelector('button.icon-record');
const stopButton = document.querySelector('button.icon-stop');
const loadImagesButton = document.querySelector('button.icon-image');
const status = document.querySelector('#framez'); // why tf is this called "status"?
const message = document.querySelector('#message');

let styleDim;

let frames = [];
document.querySelectorAll('.canvas-frame').forEach((e, i) => {
  let frame = new CanvasFrame('canvas' + i, {canvas: e, dim: 4096});
  e.addEventListener('dblclick', () => frame.loadImageFromPrompt());
  frames.push(frame);
});

function parseArgs(str) {
  let [p, q] = str.split('?');
  q = q || '';
  let pairs = q.split('&');
  let obj = {};
  for (let pair of pairs) {
    let [k, v] = pair.split('=').map((e) => e.trim());
    v = v || '';
    obj[k] = v;
  }
  return obj;
}
let args = parseArgs(location.href);
let play = args.test == undefined;
CONF_PATH = args.program || args.p || CONF_PATH;

window.addEventListener('DOMContentLoaded', () => {
  console.log('wedge');

  let main = document.querySelector('.main');
  let body = document.querySelector('body');
  let shiftString = '';

  window.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey && !ev.shiftKey) {
      if (ev.key == 's') {
        promptDownload();
      }
      else if (ev.key.match(/^[0-9a-fA-F]$/)) {
        shiftString += ev.key
      }
      else {
        return;
      }
      ev.preventDefault();
    }
    else if (ev.key == 'Tab') {
      player.togglePlay();
    }
    else if (ev.key == 'r') {
      player.resetCounter();
    }
    else if (ev.key == ' ') {
      if (player.settings.play)
        player.togglePlay();
      else
        player.animate();
    }
    else {
      return;
    }
    ev.preventDefault();
  });
  window.addEventListener('keyup', (ev) => {
    if (ev.key == 'Control') {
      if (shiftString.length == 3 || shiftString.length == 6) {
        let code = '#' + shiftString;
        body.style.backgroundColor = code;
      }
      shiftString = '';
    }
  });

  window.addEventListener('resize', resize);
  function resize() {
    let [w, h] = [window.innerWidth, window.innerHeight];
    if (w > h) {
      main.style.top = main.style.bottom = '0';
      main.style.left = main.style.right = ((w / h - 1) / 2 * h) + 'px';
      styleDim = h;
    }
    else {
      main.style.left = main.style.right = '0';
      main.style.top = main.style.bottom = ((h / w - 1) / 2 * w) + 'px';
      styleDim = w;
    }
  }
  resize();

  for (let group of document.querySelectorAll('.tabs')) {
    let panes = Array.from(group.querySelectorAll('.tab-pane'));
    let body = group.querySelector('.tab-body');
    let select = document.querySelector('#tab-selector');
    select.addEventListener('change', (ev) => {
      let v = select.value;
      v = parseInt(v);
      panes.forEach((pane) => pane.classList.remove('active'));
      panes[v].classList.add('active');
    });
  }

  recordButton.onclick = () => {
    player.recording = !player.recording;
    if (player.recording) {
      player.resetCounter();
      fetch('/reset', {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': `text/plain`},
        body: 'ohai i can haz reset plx?'
      });
    }
    recordButton.innerHTML = player.recording ? 'Stop' : 'Start';
    recordButton.classList.toggle('active', player.recording);
  }

  stopButton.onclick = () => {
    console.log('Stopping...');
    player.togglePlay(false);
  }

  loadImagesButton.onclick = () => {
    player.loadImages()
  }

  message.onclick = () => {
    message.classList.remove('visible');
  }

  canvas.addEventListener('pointerdown', handlePointer);
  canvas.addEventListener('pointerup', handlePointer);
  canvas.addEventListener('pointerout', handlePointer);
  canvas.addEventListener('pointercancel', handlePointer);

  canvas.addEventListener('pointermove', handlePointer);

  function handlePointer(ev) {
    if (!player?.uniforms)
      return;
    player.uniforms.cursorLast = player.uniforms.cursorPos;
    player.uniforms.cursorPos = [
      ev.offsetX / styleDim * 2 - 1,
      ev.offsetY / styleDim * -2 + 1,
    ];

    if (ev.type == 'pointerdown') {
      player.cursorDown = true;
      player.uniforms.cursorLast = player.uniforms.cursorPos.slice();
    }
    else if (ev.type == 'pointerup' || ev.type == 'pointerout' || ev.type == 'pointercancel') {
      player.cursorDown = false;
    }

    player.uniforms.cursorAngle = Math.atan2(ev.offsetY, ev.offsetX);
  }

});

let program = new Program(CONF_PATH);
let player;
program.onready = () => {
  player = new Player(program, canvas, frames, status, message);
  player.init();
};
