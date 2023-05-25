const  fs = require('fs');
const request = require('request');

let interval;
function startTyping (message) {
    message.channel.sendTyping();
    interval = setInterval(() => {
        message.channel.sendTyping();
    }, 1000)
}

// Stop typing indicator
function stopTyping() {
    clearInterval(interval);
}

function download (uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(`/home/ftpuser/chatgpt/${filename}`)).on('close', callback);
  });
};

// Extract image ID from URL
function extractImgID(string) {
    const regex = /\/([\w-]+\.png)\?/
    const found = string.match(regex);

    if (found) {
        return found[1];
    }
    
    return null;
}

module.exports = {
    startTyping,
    stopTyping,
    download,
    extractImgID
}