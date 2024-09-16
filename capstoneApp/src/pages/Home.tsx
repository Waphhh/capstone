import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonIcon,
  IonFooter,
  IonLabel,
  IonToast
} from '@ionic/react';
import { micOutline, stopCircleOutline, homeOutline, settingsOutline, peopleOutline, giftOutline } from 'ionicons/icons';
import './Home.css'; // Add your custom styles
import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from './firebaseConfig'; 

const Home: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        uploadAudioToFirebase(audioBlob); // Upload the audio to Firebase
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

  const uploadAudioToFirebase = async (audioBlob: Blob) => {
    const fileName = 'recordings/' + storedPhoneNumber + '_' + Date.now() + '.wav'; // Name the file uniquely
    const storageRef = ref(storage, fileName);

    try {
      // Upload the audio file to Firebase
      const snapshot = await uploadBytes(storageRef, audioBlob);
      console.log('Uploaded a blob or file!', snapshot);

      // Get the download URL for the uploaded audio
      const downloadURL = await getDownloadURL(snapshot.ref);
      setAudioUrl(downloadURL);
      console.log('Download URL:', downloadURL);

      // Show the toast notification
      setShowToast(true);
    } catch (error) {
      console.error('Error uploading audio to Firebase:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Home page</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>

          {/* Welcome Section */}
          <IonRow>
            <IonCol>
              <div className="welcome-card">
                <img src="path_to_logo" alt="Logo" className="logo" />
                <h2>Welcome</h2>
                <IonLabel className="subtitle">Hot Apps</IonLabel>
                <p>Apps that would be useful for you!</p>
                <IonButton fill="solid" color="danger" size="small">
                  Read more
                </IonButton>
              </div>
            </IonCol>
          </IonRow>

          {/* Ongoing Requests */}
          <IonRow>
            <IonCol>
              <IonCard className="ongoing-requests-card">
                <IonCardHeader>
                  <IonCardTitle>Ongoing Requests</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p className="request-item">
                    <span>Recorded Request 1: Google maps</span>
                    <IonLabel className="accepted-label">Accepted</IonLabel>
                  </p>
                  <p className="request-item">
                    <span>Recorded Request 2: YouTube</span>
                    <IonLabel className="pending-label">Pending</IonLabel>
                  </p>
                  <IonButton fill="clear" className="expand-button">▼</IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* Rate Previous Volunteers */}
          <IonRow>
            <IonCol size="6">
              <IonCard className="volunteer-card">
                <img src="path_to_image" alt="Volunteer" />
                <IonCardContent>
                  Helped you set up Google
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard className="volunteer-card">
                <img src="path_to_image" alt="Volunteer" />
                <IonCardContent>
                  Helped you learn YouTube, Candy Crush, and Roblox
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div>
          <IonFab vertical="bottom" horizontal="center" slot="fixed">
            {/* Button for starting/stopping recording */}
            {isRecording ? (
              <IonFabButton onClick={stopRecording}>
                <IonIcon icon={stopCircleOutline} />
              </IonFabButton>
            ) : (
              <IonFabButton onClick={startRecording}>
                <IonIcon icon={micOutline} />
              </IonFabButton>
            )}
            {/* Toast Notification */}
            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message="Audio has been recorded and uploaded successfully!"
              duration={2000}
              position="bottom"
            />

            {/* Display the recorded audio
            {audioUrl && (
              <div>
                <p>Recorded Audio:</p>
                <audio controls src={audioUrl}></audio>
              </div>
            )} */}
          </IonFab>
        </div>
      </IonContent>

      {/* Bottom Navigation */}
      <IonFooter>
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/home">
                  <IonIcon icon={homeOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/requests">
                  <IonIcon icon={peopleOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/rewards">
                  <IonIcon icon={giftOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/settings">
                  <IonIcon icon={settingsOutline} />
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Home;
