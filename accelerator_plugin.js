const ytPluginStart = function () {
    console.log("YouTube Accelerator loaded");

    const ytp = {
        settings: {
            maxSpeed: 8,
            tooltipFade: 300,
            slowerKeyCode:   "188", // ,
            fasterKeyCode:   "190", // .
            resetKeyCode:     "82", // R
            subtitlesKeyCode:  "83", // S
            qualityKeyCode:   "81", // Q
            keepSpeed: true
        }
    }

    const updateSettings = function () {
        chrome.storage.sync.get({
            maxSpeedSetting: "x8",
            hotkeysSetting: "s3",
            keepSpeedSetting: "yes"
        }, (items) => {
            if (items.maxSpeedSetting == "x8") {
                ytp.settings.maxSpeed = 8;
            } else if (items.maxSpeedSetting == "x4") {
                ytp.settings.maxSpeed = 4;
            } else if (items.maxSpeedSetting == "x3") {
                ytp.settings.maxSpeed = 3;
            }

            if (items.hotkeysSetting == "s1") {
                ytp.settings.slowerKeyCode = "219"; // [
                ytp.settings.fasterKeyCode = "221"; // ]
            } else if (items.hotkeysSetting == "s2") {
                ytp.settings.slowerKeyCode = "186"; // ;
                ytp.settings.fasterKeyCode = "222"; // '
            } else if (items.hotkeysSetting == "s3") {
                ytp.settings.slowerKeyCode = "188"; // ,
                ytp.settings.fasterKeyCode = "190"; // .
            }

            ytp.settings.keepSpeed = items.keepSpeedSetting == "yes";
        });
    }

    chrome.storage.onChanged.addListener(() => {
        updateSettings();
    });

    updateSettings();

    ytp.videoController = function (video) {
        let elem = document.createDocumentFragment();

        let div = document.createElement("div");
        div.className = "PlayBackRatePanel";
        div.style.display = "none";

        let inner = document.createElement("button");
        inner.className = "PlayBackRateTooltip";

        div.appendChild(inner);
        elem.appendChild(div);

        video.parentElement.parentElement.insertBefore(elem, video.parentElement);
        video.acceleratorEnabled = true;
    }

    document.addEventListener("keydown", (ev) => {
        if ((document.activeElement.nodeName === "INPUT" && document.activeElement.getAttribute("type") === "text")
            || (document.activeElement.parentElement.nodeName === "YT-FORMATTED-STRING"
                && document.activeElement.parentElement.getAttribute("id") === "contenteditable-textarea")
            || (ev.which != ytp.settings.slowerKeyCode && ev.which != ytp.settings.fasterKeyCode && ev.which != ytp.settings.resetKeyCode
                && ev.which != ytp.settings.qualityKeyCode && ev.which != ytp.settings.subtitlesKeyCode
                && ev.which != "188" && ev.which != "190")) {
            return;
        }

        let vids = document.getElementsByTagName("video");
        let accelerationValue = Number(sessionStorage.getItem("ytAcceleratorValue"));

        if (accelerationValue == 0) {
            if (vids.length > 0) {
                accelerationValue = vids[0].playbackRate;
            } else {
                return;
            }
        }

        if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.fasterKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
            accelerationValue = Math.min(accelerationValue + 0.25, ytp.settings.maxSpeed);
        } else if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.slowerKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
            accelerationValue = Math.max(accelerationValue - 0.25, 0.25);
        } else if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.resetKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
            accelerationValue = 1;
        } else {
            if (ev.shiftKey && "190".match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                if (vids.length > 0) {
                    sessionStorage.setItem("ytAcceleratorValue", Math.min(vids[0].playbackRate + 0.25, 2));
                }
            } else if (ev.shiftKey && "188".match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                if (vids.length > 0) {
                    sessionStorage.setItem("ytAcceleratorValue", Math.max(vids[0].playbackRate - 0.25, 0.25));
                }
            } else if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.qualityKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                const settingsButton = document.getElementsByClassName('ytp-settings-button');
                if (settingsButton != null && settingsButton.length > 0) {
                    settingsButton[0].click();
                    const items = document.getElementsByClassName('ytp-menuitem');
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].innerText.includes("Quality")) {
                            items[i].click();
                            break;
                        }
                    }
                }
            } else if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey && ytp.settings.subtitlesKeyCode.match(new RegExp("(?:^|,)" + ev.which + "(?:,|$)"))) {
                const settingsButton = document.getElementsByClassName('ytp-settings-button');
                if (settingsButton != null && settingsButton.length > 0) {
                    settingsButton[0].click();
                    const items = document.getElementsByClassName('ytp-menuitem');
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].innerText.includes("Subtitles")) {
                            items[i].click();
                            break;
                        }
                    }
                }
            }

            return;
        }

        for (let i = 0; i < vids.length; i++) {
            if (!vids[i].acceleratorEnabled) {
                new ytp.videoController(vids[i]);
            }

            vids[i].playbackRate = accelerationValue;
        }

        sessionStorage.setItem("ytAcceleratorValue", accelerationValue);
        applyPlaybackRate(accelerationValue);
    }, true);

    const updateTooltips = function () {
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

    const applyPlaybackRate = function (playbackRate) {
        let tooltips = document.querySelectorAll(".PlayBackRatePanel,.PlayBackRatePanelFullScreen");
        for (let i = 0; i < tooltips.length; i++) {
            let tooltip = tooltips[i];

            if (tooltip.childNodes != null && tooltip.childNodes.length > 0) {
                tooltip.childNodes[0].textContent = playbackRate + "x";
            }

            if (tooltip.style.display === "none") {
                tooltip.style.display = "inline";
            }

            setTimeout(() => {
                if (Number(sessionStorage.getItem("ytAcceleratorValue")) == playbackRate) {
                    tooltip.style.display = "none";
                }
            }, ytp.settings.tooltipFade);
        }
    }

    const reapply = function () {
        if (window.location.pathname === "/watch") {
            const settingsButton = document.getElementsByClassName('ytp-settings-button');
            if (settingsButton != null && settingsButton.length > 0) {
                settingsButton[0].click();
                settingsButton[0].click();

                const ambientModeOff = () => {
                    const items = document.getElementsByClassName('ytp-menuitem');
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].innerText.includes("Ambient")) {
                            if (items[i].getAttribute('aria-checked') === "true") {
                                items[i].click();
                                setTimeout(ambientModeOff, 100);
                            }
                            break;
                        }
                    }
                }
                setTimeout(ambientModeOff, 100);
            }

            const clearAnnoyingListeners = () => {
                const scrollForDetailsButton = document.getElementsByClassName('ytp-fullerscreen-edu-button');
                if (scrollForDetailsButton != null && scrollForDetailsButton.length > 0) {
                    scrollForDetailsButton[0].remove();
                } else {
                    setTimeout(clearAnnoyingListeners, 300);
                }
            }
            setTimeout(clearAnnoyingListeners, 300);
        }

        if (!ytp.settings.keepSpeed) {
            sessionStorage.setItem("ytAcceleratorValue", 1);
            return;
        }

        let accelerationValue = Number(sessionStorage.getItem("ytAcceleratorValue"));
        if (accelerationValue == 0) {
            return;
        }

        let vids = document.getElementsByTagName("video");
        for (let i = 0; i < vids.length; i++) {
            if (!vids[i].acceleratorEnabled) {
                new ytp.videoController(vids[i]);
            }

            vids[i].playbackRate = accelerationValue;
        }

        if (accelerationValue != 1) {
            applyPlaybackRate(accelerationValue);
        }
    }

    window.addEventListener("yt-navigate-finish", reapply, true);
    reapply();
}

const waitForYtPageComplete = function () {
    if (document.readyState === "interactive" || document.readyState === "complete") {
        ytPluginStart();
    } else {
        setTimeout(waitForYtPageComplete, 200);
    }
}

setTimeout(waitForYtPageComplete, 300);
