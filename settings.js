function saveMaxSpeed() {
  var value = document.getElementById('maxSpeedSetting').value;
  chrome.storage.sync.set({
    maxSpeedSetting: value
  }, function() {
    
  });
}

function saveHotkeys() {
  var value = document.getElementById('hotkeysSetting').value;
  chrome.storage.sync.set({
    hotkeysSetting: value
  }, function() {
    
  });
}

function saveKeepSpeed() {
  var value = document.getElementById('keepSpeedSetting').value;
  chrome.storage.sync.set({
    keepSpeedSetting: value
  }, function() {
    
  });
}

function restoreOptions() {
  chrome.storage.sync.get({
    maxSpeedSetting: 'x8',
    hotkeysSetting: 's3',
    keepSpeedSetting: 'yes'
  }, function(items) {
    document.getElementById('maxSpeedSetting').value = items.maxSpeedSetting;
    document.getElementById('hotkeysSetting').value = items.hotkeysSetting;
    document.getElementById('keepSpeedSetting').value = items.keepSpeedSetting;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById('maxSpeedSetting').addEventListener('change', saveMaxSpeed);
document.getElementById('hotkeysSetting').addEventListener('change', saveHotkeys);
document.getElementById('keepSpeedSetting').addEventListener('change', saveKeepSpeed);