import React, { useRef, useState } from 'react';

function App() {
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const audioPlayerRef = useRef(null); // To control audio playback

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Change to WAV
        const audioURL = URL.createObjectURL(audioBlob);
        audioPlayerRef.current.src = audioURL; // Set the audio source

        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.wav');

        try {
          const response = await fetch('http://localhost:5000/upload-audio', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();
          if (data.text) {
            setTranscription(data.text);
            audioPlayerRef.current.play(); // Play the recorded voice
          } else {
            setTranscription(data.error || 'Transcription failed.');
          }
        } catch (err) {
          console.error('Upload error:', err);
          setTranscription('Failed to upload audio.');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      setTranscription('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-600 text-white p-6">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold mb-4">Voice to Text</h1>
        <div className="flex justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>

        {transcription && (
          <div className="bg-white text-gray-900 p-4 rounded-lg shadow-lg max-w-xl mx-auto mt-6">
            <h3 className="text-xl font-semibold mb-2">Transcription:</h3>
            <p className="text-lg">{transcription}</p>
          </div>
        )}

        <audio ref={audioPlayerRef} controls className="mt-4" />
      </div>
    </div>
  );
}

export default App;
