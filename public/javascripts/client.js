const socket = io.connect()
let processor = null
let localstream = null

var filename;


$(document).ready(function(){
    
    generateSeed()
        
  
    $('.toggler').click(function(){
        if($(this).hasClass("active")) {
          $(this).removeClass("active");
          stopRecording(filename);
          generateSeed();
        }else{
          $(this).addClass("active");
          startRecording(filename);
          if($('#textbox').val()){
              filename = $('#textbox').val();
              console.log(filename);
          }
        }
    });
      
});

function generateSeed(){
    $('#textbox').val("");
    filename = randomNumber(1000000000, 9999999999);
    $('#textbox').attr("placeholder", filename);
}

function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}


function startRecording(filename) {
    console.log('start recording')
    context = new window.AudioContext()
    socket.emit('start', { 'sampleRate': context.sampleRate })

    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
        localstream = stream
        const input = this.context.createMediaStreamSource(stream)
        processor = context.createScriptProcessor(4096, 1, 1)

        input.connect(processor)
        processor.connect(context.destination)

        processor.onaudioprocess = (e) => {
            const voice = e.inputBuffer.getChannelData(0)
            socket.emit('send_pcm', voice.buffer)
        }
    }).catch((e) => {
        // "DOMException: Rrequested device not found" will be caught if no mic is available
        console.log(e)
    })
}

function stopRecording(filename) {
    console.log("stop recording");
    processor.disconnect()
    processor.onaudioprocess = null
    processor = null
    localstream.getTracks().forEach((track) => {
        track.stop()
    })
    socket.emit('stop', {filename: filename}, (res) => {
        console.log(`Audio data is saved as ${res.filename}`)
    })
}
