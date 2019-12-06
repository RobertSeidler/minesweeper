const { ipcRenderer } = require('electron');
require('./segment_display/segment.js').defineElement('seven-segment-digit');
require('./MineSweeperComponent.js').defineElement('mine-sweeper', ipcRenderer);