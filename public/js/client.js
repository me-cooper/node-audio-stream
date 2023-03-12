const slugify = str =>
  str
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '')
    .replace(/[^\w\s-]/g, '-')
    .replace(/^-+|-+$/g, '');

$(document).ready(function(){
    
    var defaultFilename = slugify(new Date().toLocaleString("de-DE"));
    $('#textbox').val(defaultFilename);

    $('.toggler').click(function(){
        var filename = $('#textbox').val();
        if($(this).hasClass("active")) {
            // Stop recording
            $(this).removeClass("active");
            stopRecording(filename);
        }else{
            // Start recording
            $(this).addClass("active");
            startRecording(filename);
        }
    });
      
});



/* ######### ######### ######### STREAM ######### ######### ######### ######### */
const socket = io.connect();
let localstream = null;
let processor = null

function startRecording(filename) {
    context = new window.AudioContext()
    socket.emit('start', { 'sampleRate': context.sampleRate })

    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {

        const input = this.context.createMediaStreamSource(stream);
        localstream = stream

        // Audiobuffer Size
        processor = context.createScriptProcessor(8192, 1, 1);

        input.connect(processor);
        processor.connect(context.destination);

        processor.onaudioprocess = (e) => {
            const voice = e.inputBuffer.getChannelData(0)
            socket.emit('sendAudioPCM', voice.buffer)
        }

    }).catch((e) => {
        console.log(e)
    })
}

function stopRecording(filename) {
    // Disconnect audio processor
    processor.disconnect();
    processor.onaudioprocess    = null;
    processor                   = null;

    localstream.getTracks().forEach((track) => {
        track.stop();
    })

    // Emit stop event
    socket.emit('stop', {filename: filename});
}