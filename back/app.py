from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import speech_recognition as sr
from pydub import AudioSegment
import traceback  # For better error logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains on all routes

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file in request"}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    webm_path = os.path.join(UPLOAD_FOLDER, 'audio.webm')
    wav_path = os.path.join(UPLOAD_FOLDER, 'audio.wav')

    try:
        # Save the uploaded WebM file
        audio_file.save(webm_path)
        print(f"Saved WebM file to {webm_path}")

        # Convert WebM to WAV
        audio = AudioSegment.from_file(webm_path, format="webm")
        audio.export(wav_path, format="wav")
        print(f"Converted to WAV and saved to {wav_path}")

        # Transcribe WAV using speech_recognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
                print(f"Transcription result: {text}")
                return jsonify({"text": text})
            except sr.UnknownValueError:
                print("Google Speech Recognition could not understand audio")
                return jsonify({"error": "Unable to recognize speech, please try again."}), 400
            except sr.RequestError as e:
                print(f"Error with the API request: {e}")
                return jsonify({"error": f"Could not request results from Google Speech Recognition service; {e}"}), 500
    except Exception as e:
        # Log the traceback to help debug the error
        error_message = f"Error processing file: {str(e)}\n{traceback.format_exc()}"
        print(error_message)  # This will print to the console where your Flask app is running
        return jsonify({"error": "Failed to process the audio file."}), 500

if __name__ == '__main__':
    app.run(debug=True)
