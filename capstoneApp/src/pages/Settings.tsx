import { useState, useRef } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { micOutline, stopCircleOutline } from 'ionicons/icons';

const Home: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Function to start recording
  const startRecording = async () => {
    try {
      console.log("recording");
      // Request permission to use the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio data in chunks
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Create the audio blob and URL when recording stops
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone: ', err);
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      {/* Button for starting/stopping recording */}
      {isRecording ? (
        <IonButton onClick={stopRecording}>
          <IonIcon icon={stopCircleOutline} />
        </IonButton>
      ) : (
        <IonButton onClick={startRecording}>
          <IonIcon icon={micOutline} />
        </IonButton>
      )}

      {/* Display the recorded audio */}
      {audioUrl && (
        <div>
          <p>Recorded Audio:</p>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
};

export default Home;
