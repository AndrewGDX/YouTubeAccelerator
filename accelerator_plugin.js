var ytPluginStart = function() {
    console.log("YouTube Accelerator loaded");

    var ytp = {
        settings: {
            maxSpeed: 8,
            tooltipFade: 300,
            slowerKeyCode: "188", // ,
            fasterKeyCode: "190", // .
            resetKeyCode: "82" // R
        }
    };

    var updateSettings = function () {
        chrome.storage.sync.get({
            maxSpeedSetting: 'x8',
            hotkeysSetting: 's1'
        }, function(items) {
            if (items.maxSpeedSetting == 'x8') {
                ytp.settings.maxSpeed = 8;
            } else if (items.maxSpeedSetting == 'x4') {
                ytp.settings.maxSpeed = 4;
            } else if (items.maxSpeedSetting == 'x3') {
                ytp.settings.maxSpeed = 3;
            }

            if (items.hotkeysSetting == 's1') {
                ytp.settings.slowerKeyCode = "219"; // [
                ytp.settings.fasterKeyCode = "221"; // ]
            } else if (items.hotkeysSetting == 's2') {
                ytp.settings.slowerKeyCode = "186"; // ;
                ytp.settings.fasterKeyCode = "222"; // '
            } else if (items.hotkeysSetting == 's3') {
                ytp.settings.slowerKeyCode = "188"; // ,
                ytp.settings.fasterKeyCode = "190"; // .
            }
        });
    }

    chrome.storage.onChanged.addListener(function(changes, namespace) {
        updateSettings();
    });

    updateSettings();

    ytp.videoController = function(R) {
        this.video = R;
        this.initializeControls();
        this.speedIndicator.textContent = "1x";
        R.addEventListener("ratechange", function(V) {
            if (R.readyState === 0) {
                return;
            }
            this.speedIndicator.textContent = this.video.playbackRate + "x";
        }.bind(this));
    };

    ytp.videoController.prototype.initializeControls = function() {
        var R = document.createDocumentFragment();
        var S = document.createElement("div");
        S.setAttribute("id", "PlayBackRatePanel");
        S.className = "PlayBackRatePanel";
        var T = document.createElement("button");
        T.setAttribute("id", "PlayBackRate");
        T.className = "btn";
        S.style.display = "none";
        S.appendChild(T);
        R.appendChild(S);
        this.video.parentElement.parentElement.insertBefore(R, this.video.parentElement);
        this.speedIndicator = T;
    };

    var vids = document.getElementsByTagName("video");
    for (var i = 0; i < vids.length; i++) {
        new ytp.videoController(vids[i]);
    }

    document.addEventListener("DOMNodeInserted", function(R) {
        var node = R.target || null;
        if (node && node.nodeName === "VIDEO") {
            new ytp.videoController(node);
        }
    });
    
    document.addEventListener("keydown", function(R) {
        if ((document.activeElement.nodeName === "INPUT" && document.activeElement.getAttribute("type") === "text")
            || (document.activeElement.parentElement.nodeName === "YT-FORMATTED-STRING" && document.activeElement.parentElement.getAttribute("id") === "contenteditable-textarea")) {
            return false;
        }

        var vids = document.getElementsByTagName("video");

        for (var i = 0; i < vids.length; i++) {
            var vid = vids[i];
            if (!R.shiftKey && !R.metaKey && !R.ctrlKey && ytp.settings.fasterKeyCode.match(new RegExp("(?:^|,)" + R.which + "(?:,|$)"))) {
                if (vid.playbackRate < ytp.settings.maxSpeed) {
                    vid.playbackRate += 0.25;
                } else {
                    vid.playbackRate = ytp.settings.maxSpeed;
                }
            } else if (!R.shiftKey && !R.metaKey && !R.ctrlKey && ytp.settings.slowerKeyCode.match(new RegExp("(?:^|,)" + R.which + "(?:,|$)"))) {
                if (vid.playbackRate > 0.25) {
                    vid.playbackRate -= 0.25;
                }
            } else if (!R.shiftKey && !R.metaKey && !R.ctrlKey && ytp.settings.resetKeyCode.match(new RegExp("(?:^|,)" + R.which + "(?:,|$)"))) {
                vid.playbackRate = 1;
            } else {
                if (R.shiftKey && ytp.settings.fasterKeyCode.match(new RegExp("(?:^|,)" + R.which + "(?:,|$)"))) {
                    sessionStorage.setItem("ytAcceleratorValue", Math.min(vid.playbackRate + 0.25, 2));
                } else if (R.shiftKey && ytp.settings.slowerKeyCode.match(new RegExp("(?:^|,)" + R.which + "(?:,|$)"))) {
                    sessionStorage.setItem("ytAcceleratorValue", Math.max(vid.playbackRate - 0.25, 0.25));
                }
                
                return false;
            }

            sessionStorage.setItem("ytAcceleratorValue", vid.playbackRate);
            showTooltip(vid.playbackRate);
        };

        return false;
    }, true);

    var updateTooltips = function() {
        var tooltips = document.querySelectorAll(".PlayBackRatePanel,.PlayBackRatePanelFullScreen");
        for (let i = 0; i < tooltips.length; i++) {
            if (document.webkitIsFullScreen == true) {
                tooltips[i].className = "PlayBackRatePanelFullScreen";
            } else {
                tooltips[i].className = "PlayBackRatePanel";
            }
        }
    }

    document.addEventListener("fullscreenchange", updateTooltips, false);
    document.addEventListener("msfullscreenchange", updateTooltips, false);
    document.addEventListener("mozfullscreenchange", updateTooltips, false);
    document.addEventListener("webkitfullscreenchange", updateTooltips, false);

    var showTooltip = function (playbackRate) {
        var tooltips = document.querySelectorAll(".PlayBackRatePanel,.PlayBackRatePanelFullScreen");
        for (var i = 0; i < tooltips.length; i++) {
            var tstyle = tooltips[i].style;

            if (tstyle.display === "none") {
                tstyle.display = "inline";
            }

            setTimeout(function() {
                if (sessionStorage.getItem("ytAcceleratorValue") == playbackRate) {
                    tstyle.display = "none";
                }
            }, ytp.settings.tooltipFade);
        }
    }

    window.addEventListener("yt-navigate-finish", () => {
        var ytAcceleration = sessionStorage.getItem("ytAcceleratorValue");

        if (ytAcceleration == null) {
            return;
        }

        var vids = document.getElementsByTagName("video");
        for (var i = 0; i < vids.length; i++) {
            vids[i].playbackRate = ytAcceleration;
        }

        if (ytAcceleration != 1) {
            showTooltip(ytAcceleration);
        }
    }, true);
}

var waitForYtPageComplete = function() {
    if (document.readyState === "complete") {
        ytPluginStart();
    } else {
        setTimeout(waitForYtPageComplete, 200);
    }
}

setTimeout(waitForYtPageComplete, 300);