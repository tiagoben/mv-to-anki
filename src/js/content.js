import * as $ from 'jquery';


if (window == top) {
    chrome.extension.onMessage.addListener(function (req, sender, sendResponse) {
        var sentences = [];
        var trads = [];

        $('.mejs-audio').prev().prev().map(function(){
            var t = $(this).html(); 
            var s = t.substring(0, t.indexOf('<br>')).replace(/<em>|<\/em>|<strong>|<\/strong>/g, ''); 
            var tr = t.substring(t.indexOf('<br>')+5).replace(/<em>|<\/em>|<strong>|<\/strong>/g, '');  
            sentences.push(s);
            trads.push(tr);
        });

        var soundsUrl = $('source[type="audio/mpeg"]').map( function(){return $(this).attr('src')}).get();
        var soundsName = soundsUrl.map(function(url){ return url.substring(url.lastIndexOf('/')+1, url.lastIndexOf('?')) });

        var cards = [];

        for (var i = 0; i < sentences.length; i++) {
            cards.push(
                {
                    'sentence':sentences[i],
                    'trad': trads[i],
                    'soundUrl':soundsUrl[i],
                    'soundName':soundsName[i]
                }
            );
        }
        console.log("Cards found: " + cards.length);
        sendResponse({cards: cards, url:window.location.href });     
    });
}