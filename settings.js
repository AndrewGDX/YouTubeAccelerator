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

function restoreOptions() {
  chrome.storage.sync.get({
    maxSpeedSetting: 'x8',
    hotkeysSetting: 's3'
  }, function(items) {
    document.getElementById('maxSpeedSetting').value = items.maxSpeedSetting;
    document.getElementById('hotkeysSetting').value = items.hotkeysSetting;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById('maxSpeedSetting').addEventListener('change', saveMaxSpeed);
document.getElementById('hotkeysSetting').addEventListener('change', saveHotkeys);