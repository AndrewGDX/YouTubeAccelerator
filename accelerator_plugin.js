let ytPluginStart = function () {
    console.log("YouTube Accelerator loaded");

    let ytp = {
        settings: {
            maxSpeed: 8,
            tooltipFade: 300,
            slowerKeyCode: "188", // ,
            fasterKeyCode: "190", // .
            resetKeyCode: "82", // R
            keepSpeed: true
        }
    };

    let updateSettings = function () {
        chrome.storage.sync.get({
            maxSpeedSetting: 'x8',
            hotkeysSetting: 's1',
            keepSpeedSetting: 'yes'
        }, function (items) {
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

            ytp.settings.keepSpeed = items.keepSpeedSetting == 'yes';
        });
    }

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        updateSettings();
    });

    updateSettings();

    ytp.videoController = function (vid) {
        this.video = vid;
        this.initializeControls();
        this.speedIndicator.textContent = "1x";
        vid.addEventListener("ratechange", function() {
            if (vid.readyState === 0) {
                return;
            }
            this.speedIndicator.textContent = this.video.playbackRate + "x";
        }.bind(this));
    };

    ytp.videoController.prototype.initializeControls = function () {
        let R = document.createDocumentFragment();
        let S = document.createElement("div");
        S.setAttribute("id", "PlayBackRatePanel");
        S.className = "PlayBackRatePanel";
        let T = document.createElement("button");
        T.setAttribute("id", "PlayBackRate");
        T.className = "btn";
        S.style.display = "none";
        S.appendChild(T);
        R.appendChild(S);
        this.video.parentElement.parentElement.insertBefore(R, this.video.parentElement);
        this.speedIndicator = T;
    };

    let vids = document.getElementsByTagName("video");
    for (let i = 0; i < vids.length; i++) {
        new ytp.videoController(vids[i]);
    }

    document.addEventListener("DOMNodeInserted", function (ev) {
        let node = ev.target || null;
        if (node && node.nodeName === "VIDEO") {
            new ytp.videoController(node);
        }
    });

    document.addEventListener("keydown", function (ev) {
        if ((document.activeElement.nodeName === "INPUT" && document.activeElement.getAttribute("type") === "text")
            || (document.activeElement.parentElement.nodeName === "YT-FORMATTED-STRING" && document.activeElement.parentElement.getAttribute("id") === "contenteditable-textarea")) {
            return false;
        }

        let vids = document.getElementsByTagName("video");

        for (let i = 0; i < vids.length; i++) {
            let vid = vids[i];
            if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.fasterKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                if (vid.playbackRate < ytp.settings.maxSpeed) {
                    vid.playbackRate += 0.25;
                } else {
                    vid.playbackRate = ytp.settings.maxSpeed;
                }
            } else if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.slowerKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                if (vid.playbackRate > 0.25) {
                    vid.playbackRate -= 0.25;
                }
            } else if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.resetKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                vid.playbackRate = 1;
            } else {
                if (ev.shiftKey && ytp.settings.fasterKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                    sessionStorage.setItem("ytAcceleratorValue", Math.min(vid.playbackRate + 0.25, 2));
                } else if (ev.shiftKey && ytp.settings.slowerKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                    sessionStorage.setItem("ytAcceleratorValue", Math.max(vid.playbackRate - 0.25, 0.25));
                }

                return false;
            }

            let t = document.getElementById("PlayBackRate");
            if (t != null) t.textContent = vid.playbackRate + "x";

            sessionStorage.setItem("ytAcceleratorValue", vid.playbackRate);
            showTooltip(vid.playbackRate);
        }

        return false;
    }, true);

    let updateTooltips = function () {
        let tooltips = document.querySelectorAll(".PlayBackRatePanel,.PlayBackRatePanelFullScreen");
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

    let showTooltip = function (playbackRate) {
        let tooltips = document.querySelectorAll(".PlayBackRatePanel,.PlayBackRatePanelFullScreen");
        for (let i = 0; i < tooltips.length; i++) {
            let tstyle = tooltips[i].style;

            if (tstyle.display === "none") {
                tstyle.display = "inline";
            }

            setTimeout(function () {
                if (sessionStorage.getItem("ytAcceleratorValue") == playbackRate) {
                    tstyle.display = "none";
                }
            }, ytp.settings.tooltipFade);
        }
    }

    window.addEventListener("yt-navigate-finish", () => {
        if (!ytp.settings.keepSpeed) {
            return;
        }

        let ytAcceleration = sessionStorage.getItem("ytAcceleratorValue");

        if (ytAcceleration == null) {
            return;
        }

        let vids = document.getElementsByTagName("video");
        for (let i = 0; i < vids.length; i++) {
            vids[i].playbackRate = ytAcceleration;
        }

        document.getElementById("PlayBackRate").textContent = ytAcceleration + "x";

        if (ytAcceleration != 1) {
            showTooltip(ytAcceleration);
        }
    }, true);
}

let waitForYtPageComplete = function () {
    if (document.readyState === "complete") {
        ytPluginStart();
    } else {
        setTimeout(waitForYtPageComplete, 200);
    }
}

setTimeout(waitForYtPageComplete, 300);