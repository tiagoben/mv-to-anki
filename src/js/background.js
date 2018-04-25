import '../img/icon-16.png'
import '../img/icon-24.png'
import '../img/icon-32.png'
import '../img/icon-48.png'
import '../img/icon-128.png'

import AnkiExport from 'anki-apkg-export';

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
                const apkg = new AnkiExport(data.deckname, getTemplate());
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
            var resp = this.response;
            apkg.addMedia(card.soundName, resp);
            apkg.addCard(card.sentence + ' [sound:' + card.soundName + ']', card.trad);
            resolve()
        }
        httpRequest.send()
    });
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

function getTemplate() {
    return {
        'questionFormat': '{{Front}}',
        'answerFormat': '{{FrontSide}}\n\n<hr id="answer">\n\n{{Back}} <div class="source">Fonte: <a class="source-link" href="' + pageUrl + '">mairovergara.com</a></div>',
        'css':
            `.card {\n 
                font-family: arial;\n 
                font-size: 20px;\n 
                text-align: center;\n 
                color: black;\n
                background-color: white;\n
            }\n
            .source {\n
                margin: 20px;\n
                font-size:12px;\n
                font-style: italic;\n
                color: #555;\n
            }\n
            .source-link {\n
                color: #66c;\n
                text-decoration: none;\n
            }\n
            u {\n
                text-decoration: none;\n
                font-weight: bold;\n
                color: #06d;\n
            }\n`
    };
}

console.log('alterado');