import "../css/options.css";

function updateLabel() {
    chrome.storage.sync.get('deckname', function (data) {
        var decknameLabel = document.getElementById('deckname');
        decknameLabel.textContent = data.deckname;
    });
}

function saveDeckName() {
    var inputDeckname = document.getElementById('input-deckname');
    if (inputDeckname.value) {
        chrome.storage.sync.set({ deckname: inputDeckname.value }, function () {
            updateLabel();
            inputDeckname.value = "";
        });
    }
}

function onHitEnter(e){
    if (e.keyCode == 13) {
        saveDeckName();
    }
}
document.getElementById('save').addEventListener('click', saveDeckName);
document.getElementById('input-deckname').addEventListener('keypress', onHitEnter);
updateLabel();