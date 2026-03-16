const { app } = require('electron');

function setAutoStart(enabled) {
  const options = {
    openAtLogin: enabled,
  }

  if (process.platform === 'darwin') {
    options.openAsHidden = true
  }

  app.setLoginItemSettings(options)
}

function isAutoStartEnabled() {
  const settings = app.getLoginItemSettings()
  return settings.openAtLogin
}

module.exports.setAutoStart = setAutoStart;
module.exports.isAutoStartEnabled = isAutoStartEnabled;
