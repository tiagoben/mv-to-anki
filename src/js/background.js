import '../img/icon-16.png'
import '../img/icon-24.png'
import '../img/icon-32.png'
import '../img/icon-48.png'
import '../img/icon-128.png'

import AnkiExport from './anki/AnkiExport';

var loading = false;
var pageUrl = 'http://www.mairovergara.com';

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ deckname: "EN - English Expressions" });
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    chrome.browserAction.disable(tabId);
    if (change.status == "complete") {
        chrome.tabs.sendMessage(tabId, {}, function (message) {
            var cards = message.cards;
            if (cards && cards.length > 0) {
                chrome.browserAction.enable(tabId);
                setBadge('' + cards.length, tabId);
            }
        });
    }
});

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, {}, function (message) {
        var cards = message.cards;
        pageUrl = message.url;
        if (cards) {
            var loadInterval = setLoading(tab.id);

            chrome.storage.sync.get('deckname', function (data) {
                const apkg = new AnkiExport(data.deckname);
                Promise.all(cards.map(function (card) { return loadCard(card, apkg) }))
                    .then(function () {
                        apkg.save()
                            .then(zip => {
                                var blobUrl = URL.createObjectURL(zip);
                                chrome.downloads.download({
                                    url: blobUrl,
                                    filename: data.deckname + ".apkg"
                                });
                                clearInterval(loadInterval);
                                setBadge(cards.length + '', tab.id);
                            })
                            .catch(err => {
                                console.log(err.stack || err);
                                clearInterval(loadInterval);
                                setBadge(cards.length + '', tab.id);
                            });
                    });
            });
        }
    });
});

function loadCard(card, apkg) {
    return new Promise(function (resolve) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", card.soundUrl);
        httpRequest.responseType = "blob";
        httpRequest.onload = function () {
            var sName = limitSoundName(card.soundName);
            var resp = this.response;
            apkg.addMedia(sName, resp);
            apkg.addCard(card.sentence + '<br>[sound:' + sName + ']', card.trad, pageUrl);
            resolve()
        }
        httpRequest.send()
    });
}

function limitSoundName(name) {
    if (name.length > 100) {
        name = name.substring(0, 95) + '.mp3';
    }
    return name;
}

function setBadge(text, tabId) {
    chrome.browserAction.setBadgeText({ text: '' + text, tabId: tabId });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#FF2222", tabId: tabId });
}


function setLoading(tabId) {
    var a = 0;
    var dots = ['•••', ' ••', '   •', '    ', '•   ', '•• '];
    chrome.browserAction.setBadgeText({ text: dots[a], tabId: tabId });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#999", tabId: tabId });
    a = (a + 1) % dots.length;
    return window.setInterval(function () {
        chrome.browserAction.setBadgeText({ text: dots[a], tabId: tabId });
        a = (a + 1) % dots.length;
    }, 200);
}
