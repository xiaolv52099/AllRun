const { app } = require('electron');

function setAutoStart(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true
  })
}

function isAutoStartEnabled() {
  const settings = app.getLoginItemSettings()
  return settings.openAtLogin
}

module.exports.setAutoStart = setAutoStart;
module.exports.isAutoStartEnabled = isAutoStartEnabled;
