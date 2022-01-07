class Config {
  static get defaults() {
    return {
      controlsHidden: false,
      fit: 'contain',
      recordImages: true,
      recordVideo: false,
      screenShareEnabled: false,
      streamFit: 'cover',
      webcamEnabled: false,
      localStorageObj: window.localStorage,
      sessionStorageObj: window.sessionStorage,
    };
  }

  static toObject(kvArray) {
    let obj = {};
    for (let [key, value] of kvArray)
      obj[key] = value;
    return obj;
  }

  constructor(app, ...args) {
    this.app = app;
    Util.merge(this, Config.defaults);
    // Restore state from local/session storage
    this.restoreConfig();

    // Merge in constructor args
    Util.merge(this, ...args);
  }

  init() {
    this.setControlsHidden();
    this.setFit();
    this.setStreamFit();
    this.setWebcamEnabled();
    this.setScreenShareEnabled();
    this.setRecordImages();
    this.setRecordVideo();
  }

  setControlsHidden(val) {
    val = val != null ? val : this.controlsHidden;
    this.controlsHidden = val;
    this.storeSessionConfig({controlsHidden: val});
    this.app?.set('controlsHidden', val);
  }

  setFit(val) {
    val = val != null ? val : this.fit;
    this.fit = val;
    this.storeSessionConfig({fit: val});
    this.app?.set('fit', val);
  }

  setRecordImages(val) {
    val = val != null ? val : this.recordImages;
    this.recordImages = val;
    this.storeSessionConfig({recordImages: val});
    this.app?.set('recordImages', val);
  }

  setRecordVideo(val) {
    val = val != null ? val : this.recordVideo;
    this.recordVideo = val;
    this.storeSessionConfig({recordVideo: val});
    this.app?.set('recordVideo', val);
  }

  setScreenShareEnabled(val) {
    val = val != null ? val : this.screenShareEnabled;
    if (val) {
      navigator.mediaDevices.getDisplayMedia()
      .then((stream) => {
        this.setWebcamEnabled(false);
        this.screenShareEnabled = true;
        this.stream = stream;
        this.storeSessionConfig({screenShareEnabled: true});
        this.app?.set('screenShareEnabled', true);
      })
      .catch((err) => {
        console.error(err);
        this.setScreenShareEnabled(false);
      });
    }
    else {
      this.screenShareEnabled = false;
      this.stream = null;
      this.storeSessionConfig({screenShareEnabled: false});
      this.app?.set('screenShareEnabled', val);
    }
  }

  setStreamFit(val) {
    val = val != null ? val : this.streamFit;
    this.streamFit = val;
    this.storeSessionConfig({streamFit: val});
    this.app?.set('streamFit', val);
  }

  setWebcamEnabled(val) {
    val = val != null ? val : this.webcamEnabled;
    if (val) {
      let constraints = {
        video: true,
        audio: false
      };
      navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.setScreenShareEnabled(false);
        this.webcamEnabled = true;
        this.stream = stream;
        this.storeSessionConfig({webcamEnabled: true});
        this.app?.set('webcamEnabled', true);
      })
      .catch((err) => {
        console.error(err);
        this.setWebcamEnabled(false);
      });
    }
    else {
      this.webcamEnabled = false;
      this.stream = null;
      this.storeSessionConfig({webcamEnabled: false});
      this.app?.set('webcamEnabled', false);
    }
  }

  // --- STORAGE ---

  getKeyValues(keys) {
    let obj = {};
    for (let key of keys)
      obj[key] = this[key];
    return Util.merge({}, obj);
  }

  getSessionConfig() {
    let sessionConfig = this.getKeyValues([
      'controlsHidden',
      'fit',
      'recordImages',
      'recordVideo',
      'screenShareEnabled',
      'streamFit',
      'webcamEnabled',
    ]);
    return sessionConfig;
  };

  getLocalConfig() {
    let localConfig = this.getKeyValues([
      // TBD lol
    ]);
    return localConfig;
  }

  retrieveConfig() {
    let sessionConfig = JSON.parse(this.sessionStorageObj.getItem('sessionConfig') || '{}');
    let localConfig = JSON.parse(this.localStorageObj.getItem('localConfig') || '{}');
    return {localConfig, sessionConfig}
  }

  restoreConfig(config) {
    config = config || this.retrieveConfig();
    let {localConfig, sessionConfig} = config;
    Util.merge(this, localConfig, sessionConfig);
  }

  storeSessionState(opts={}) {
    Object.entries(opts).forEach(([key, value]) => {
      this.sessionStorageObj.setItem(key, value);
    });
  }

  storeLocalState(opts={}) {
    Object.entries(opts).forEach(([key, value]) => {
      this.localStorageObj.setItem(key, value);
    });
  }

  getSessionItem(key) {
    return this.sessionStorageObj.getItem(key);
  }

  getLocalItem(key) {
    return this.localStorageObj.getItem(key);
  }

  storeSessionConfig() {
    let config = this.getSessionConfig();
    this.sessionStorageObj.setItem('sessionConfig', JSON.stringify(config));
  }

  storeSessionConfigAsync() {
    if (!this.pendingStoreSessionAsync) {
      this.pendingStoreSessionAsync = true;
      window.setTimeout(() => {
        this.storeSessionConfig();
        this.pendingStoreSessionAsync = null;
      }, 5);
    }
  }

  storeLocalConfig() {
    let config = this.getLocalConfig();
    this.localStorageObj.setItem('localConfig', JSON.stringify(config));
  }

  storeLocalConfigAsync() {
    if (!this.pendingStoreLocalAsync) {
      this.pendingStoreLocalAsync = true;
      window.setTimeout(() => {
        this.storeLocalConfig();
        this.pendingStoreLocalAsync = null;
      }, 5);
    }
  }

  clearStorage(session=true, local=true) {
    session && this.sessionStorageObj.clear();
    local && this.localStorageObj.clear();
  }
}
