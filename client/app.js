let app;

class App {
  static parseArgs(str) {
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

  constructor(programPath) {
    console.log('Creating app...');
    this.canvas = App.CANVAS;
    this.recordButton = App.RECORD_BUTTON;
    this.playButton = App.PLAY_BUTTON;
    this.loadImagesButton = App.LOAD_IMAGES_BUTTON;
    this.webcamButton = App.WEBCAM_BUTTON;
    this.screenShareButton = App.SCREEN_SHARE_BUTTON;
    this.recordImagesButton = App.RECORD_IMAGES_BUTTON;
    this.recordVideoButton = App.RECORD_VIDEO_BUTTON;
    this.statusField = App.STATUS_FIELD;
    this.messageField = App.MESSAGE_FIELD;
    this.main = App.MAIN_ELEMENT;
    this.body = App.BODY_ELEMENT;

    this.config = new Config(this);

    this.programPath = programPath || App.DEFAULT_PROGRAM_PATH;

    this.styleDim = null;
    this.frames = Array.from(document.querySelectorAll('.canvas-frame'));

    this.configFromUrl();
    this.initializeEventListeners();
  }

  configFromUrl() {
    let args = App.parseArgs(location.href);
    this.urlArgs = args;
    this.play = args.test == undefined;
    this.programPath = args.program || args.p || this.programPath;
    this.overrideDim = parseInt(args.dim || 0);
    this.overrideTransferDim = parseInt(args.tdim || 0);
    this.overrideCounter = parseInt(args.counter || 0);
  }

  togglePlay(val) {
    val = val != null ? val : !this.player.play;
    this.player.togglePlay(val);
    this.playButton.classList.toggle('icon-play', !val);
    this.playButton.classList.toggle('icon-stop', val);
  }

  toggleRecord(val) {
    val = val != null ? val : !this.player.recording;
    this.player.toggleRecord(val);
    this.recordButton.classList.toggle('active', val);
    this.recordButton.classList.toggle('icon-record', !val);
    this.recordButton.classList.toggle('icon-stop', val);
    this.recordVideoButton.disabled = val;
  }

  toggleHidden(val) {
    val = val != null ? val : !this.config.controlsHidden;
    this.config.setControlsHidden(val);
  }

  toggleFit(val) {
    if (val == null) {
      val = this.config.fit == 'contain' ? 'cover' : 'contain';
    }
    this.config.setFit(val);
  }

  toggleStreamFit(val) {
    if (val == null) {
      val = this.config.streamFit == 'contain' ? 'cover' : 'contain';
    }
    this.config.setStreamFit(val);
  }

  toggleWebcam(val) {
    val = val != null ? val : !this.config.webcamEnabled;
    this.config.setWebcamEnabled(val);
  }

  toggleScreenShare(val) {
    val = val != null ? val : !this.config.screenShareEnabled;
    this.config.setScreenShareEnabled(val);
  }

  toggleRecordImages(val) {
    val = val != null ? val : !this.config.recordImages;
    this.config.setRecordImages(val);
  }

  toggleRecordVideo(val) {
    val = val != null ? val : !this.config.recordVideo;
    this.config.setRecordVideo(val);
  }

  set(key, val) {
    if (key == 'controlsHidden') {
      document.querySelectorAll('.hideable').forEach((el) => {
        el.classList.toggle('hidden', val);
      });
    }
    else if (key == 'fit') {
      this.handleResize();
    }
    else if (key == 'streamFit') {
      this.player?.setStreamFit(val); // This is horrendous
    }
    else if (key == 'webcamEnabled') {
      this.webcamButton.classList.toggle('active', val);
      this.player?.setStream(val ? this.config.stream : null);
    }
    else if (key == 'screenShareEnabled') {
      this.screenShareButton.classList.toggle('active', val);
      this.player?.setStream(val ? this.config.stream : null);
    }
    else if (key == 'recordImages') {
      this.recordImagesButton.classList.toggle('active', val);
      this.player?.setRecordImages();
    }
    else if (key == 'recordVideo') {
      this.recordVideoButton.classList.toggle('active', val);
    }
  }

  clearMessages() {
    this.messageField.classList.remove('visible');
  }

  initializeEventListeners() {
    // TODO: Move all this shit somewhere better
    let shiftString = '';

    window.addEventListener('keydown', (ev) => {
      let key = ev.key.toLowerCase();
      if (ev.ctrlKey && !ev.shiftKey) {
        if (ev.key == 's') {
          this.player.promptDownload();
        }
        else if (ev.key.match(/^[0-9a-fA-F]$/)) {
          shiftString += ev.key
        }
        else {
          return;
        }
        ev.preventDefault();
      }
      else if (ev.shiftKey && ev.key == 'Escape') {
        this.toggleHidden();
      }
      else if (ev.key == 'Tab') {
        if (ev.shiftKey)
          this.toggleRecord();
        else
          this.togglePlay();
      }
      else if (key == 'f') {
        if (ev.shiftKey)
          this.toggleStreamFit();
        else
          this.toggleFit();
      }
      else if (key == 'r') {
        this.player.resetCounter();
        return;
      }
      else if (key == 's') {
        this.toggleScreenShare();
      }
      else if (key == 'w') {
        this.toggleWebcam();
      }
      else if (key == 'b') {
        document.body.classList.toggle('gray');
      }
      else if (ev.key == ' ') {
        if (this.player.play)
          this.togglePlay(false);
        else
          this.player.animate();
      }
      else if (ev.key == 'ArrowUp' || ev.key == 'ArrowDown') {
        const dir = ev.key == 'ArrowUp' ? -1 : 1;
        const activeControl = document.activeElement?.parentNode;
        if (activeControl?.classList.contains('control')) {
          const container = activeControl.parentNode;
          const controls = Array.from(container.childNodes);
          const curIdx = controls.indexOf(activeControl);
          const nextIdx = (curIdx + dir + controls.length) % controls.length;
          controls[nextIdx].tabIndex = 5;
          controls[nextIdx].querySelector('.control-input').focus();
        }
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
          this.body.style.backgroundColor = code;
        }
        shiftString = '';
      }
    });

    window.addEventListener('resize', () => this.handleResize());

    this.handleResize();

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

    this.recordButton.onclick = () => this.toggleRecord();
    this.playButton.onclick = () => this.togglePlay();
    this.loadImagesButton.onclick = () => this.player.loadImages();
    this.messageField.onclick = () => this.clearMessages();
    this.webcamButton.onclick = () => this.toggleWebcam();
    this.screenShareButton.onclick = () => this.toggleScreenShare();
    this.recordImagesButton.onclick = () => this.toggleRecordImages();
    this.recordVideoButton.onclick = () => this.toggleRecordVideo();

    this.canvas.addEventListener('pointerdown', (ev) => this.handlePointer(ev));
    this.canvas.addEventListener('pointerup', (ev) => this.handlePointer(ev));
    this.canvas.addEventListener('pointerout', (ev) => this.handlePointer(ev));
    this.canvas.addEventListener('pointercancel', (ev) => this.handlePointer(ev));
    this.canvas.addEventListener('pointermove', (ev) => this.handlePointer(ev));
  }

  handleResize(ev) {
    let [w, h] = [window.innerWidth, window.innerHeight];
    let cond = this.config.fit == 'contain' ? w > h : w < h;
    if (cond) {
      this.main.style.top = this.main.style.bottom = '0';
      this.main.style.left = this.main.style.right = ((w / h - 1) / 2 * h) + 'px';
      this.styleDim = h;
    }
    else {
      this.main.style.left = this.main.style.right = '0';
      this.main.style.top = this.main.style.bottom = ((h / w - 1) / 2 * w) + 'px';
      this.styleDim = w;
    }
  }

  handlePointer(ev) {
    if (!this.player?.uniforms)
      return;
    this.player.uniforms.cursorLast = this.player.uniforms.cursorPos;
    this.player.uniforms.cursorPos = [
      ev.offsetX / this.styleDim * 2 - 1,
      ev.offsetY / this.styleDim * -2 + 1,
    ];

    if (ev.type == 'pointerdown') {
      this.player.cursorDown = true;
      this.player.uniforms.cursorLast = this.player.uniforms.cursorPos.slice();
    }
    else if (ev.type == 'pointerup' || ev.type == 'pointerout' || ev.type == 'pointercancel') {
      this.player.cursorDown = false;
    }

    this.player.uniforms.cursorAngle = Math.atan2(ev.offsetY, ev.offsetX);
  }

  run() {
    this.program = new Program(this);
    this.program.onready = () => {
      try {
        this.player = new Player(this);
        this.player.init();
        this.config.init();
      }
      catch (e) {
        console.error('o teh noes');
        console.error(e);
      }
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.run();

});

App = Object.assign(App, {
  DEFAULT_PROGRAM_PATH: 'raymarch-example',
  CANVAS: document.querySelector('#thecanvas'),
  RECORD_BUTTON: document.querySelector('#record-button'),
  PLAY_BUTTON: document.querySelector('#play-button'),
  LOAD_IMAGES_BUTTON: document.querySelector('#load-images-button'),
  WEBCAM_BUTTON: document.querySelector('#webcam-button'),
  SCREEN_SHARE_BUTTON: document.querySelector('#screen-share-button'),
  RECORD_IMAGES_BUTTON: document.querySelector('#record-images-button'),
  RECORD_VIDEO_BUTTON: document.querySelector('#record-video-button'),
  STATUS_FIELD: document.querySelector('#frame-field'),
  MESSAGE_FIELD: document.querySelector('#message-field'),
  MAIN_ELEMENT: document.querySelector('.main'),
  BODY_ELEMENT: document.querySelector('body')
});
