/* ######### ######### ######### GENERAL ######### ######### ######### ######### */
const path              = require('path');
const fs                = require('fs');


/* ######### ######### ######### SETTINGS ######### ######### ######### ######### */
const settings          = require('./settings/settings');

/* ######### ######### ######### SERVER ######### ######### ######### ######### */
const express           = require('express');
const app               = express();
const socketio          = require('socket.io');


/* ######### ######### ######### AUDIO ######### ######### ######### ######### */
const wavEncoder        = require('wav-encoder');


/* ######### ######### ######### ### ######### ######### ######### ######### ######### */
/* ######### ######### ######### END LIBRARIES ######### ######### ######### ######### */
/* ######### ######### ######### ### ######### ######### ######### ######### ######### */





/* ######### ######### ######### SERVER ######### ######### ######### ######### */
app.use('/', express.static(path.join(__dirname, 'public')));
const server = app.listen(settings.server.port, function(err){
    if (err) console.log(err);
    console.log("Server listening on Port", settings.server.port);
});



/* ######### ######### ######### SOCKETS ######### ######### ######### ######### */
const io = socketio.listen(server);

io.on('connection', (socket) => {
    socket.on('start', (data) => {
        // Samplerate comes from client
        sampleRate = data.sampleRate
    })

    let buffer = [];
    socket.on('sendAudioPCM', (data) => {
        const samples = data.values();
        const buf = new Array(data.length)
        for (var i = 0; i < buf.length; i++) {
            buf[i] = samples.next().value
        }
        buffer = buffer.concat(buf)
    })

    socket.on('stop', (data) => {
        const f32array = toF32Array(buffer);
        const filename = `${data.filename}.wav`;
        exportWAV(f32array, sampleRate, filename);
    })
})




/* ######### ######### ######### AUDIO ######### ######### ######### ######### */
const toF32Array = (buf) => {
    const buffer = new ArrayBuffer(buf.length)
    const view = new Uint8Array(buffer)
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i]
    }
    return new Float32Array(buffer)
}

const exportWAV = (data, sampleRate, filename) => {

    const audioData = {
        sampleRate: sampleRate,
        channelData: [data]
    }

    wavEncoder.encode(audioData).then((buffer) => {
        fs.writeFile(path.join(settings.audio.destinationFolder, filename), Buffer.from(buffer), (e) => {
            if (e) {
                console.log(e)
            } else {
                console.log(`File successfully saved as ${filename}`)
            }
        })
    })

}
