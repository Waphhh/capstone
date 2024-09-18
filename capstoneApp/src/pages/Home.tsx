import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
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
  IonToast,
  IonModal,
  IonDatetime
} from '@ionic/react';
import { micOutline, stopCircleOutline, homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import './Home.css';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from './firebaseConfig'; // Ensure Firebase is initialized
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const Home: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null); // Selected Date and Time
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const [ongoingRequests, setOngoingRequests] = useState<any[]>([]); // State to store requests

  // Function to start recording after date and time are selected
  const startRecording = async () => {
    // Open the modal for the user to select date and time
    setShowDateTimeModal(true);
  };

  // Function to continue recording after the time is selected
  const handleRecordingStart = async () => {
    if (!selectedDateTime) {
      console.error("Please select a date and time before starting the recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        uploadAudioToFirebase(audioBlob);
      };

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

  // Function to upload audio to Firebase
  const uploadAudioToFirebase = async (audioBlob: Blob) => {
    console.log(selectedDateTime);
    const fileName = 'recordings/' + storedPhoneNumber + '_' + selectedDateTime + '.wav';
    const storageRef = ref(storage, fileName);

    try {
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setAudioUrl(downloadURL);
      setShowToast(true);
    } catch (error) {
      console.error('Error uploading audio to Firebase:', error);
    }
  };

  // Function to fetch requests from Firestore for the current user
  const fetchOngoingRequests = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const requests = userData.requests || {};
          const requestsArray = Object.keys(requests).map((key) => ({
            name: key,
            status: requests[key],
          }));

          setOngoingRequests(requestsArray);
        } else {
          console.log("No such document!");
        }
      } else {
        console.log("Phone number not found in localStorage");
      }
    } catch (error) {
      console.error('Error fetching ongoing requests:', error);
    }
  };

  // Function to submit the date and time to Firestore and start recording
  const submitDateTimeToFirestore = async () => {
    if (storedPhoneNumber && selectedDateTime) {
      try {
        const docRef = doc(db, 'users', storedPhoneNumber);
        await updateDoc(docRef, {
          [`requests.${selectedDateTime}`]: 'Pending'
        });
        setShowDateTimeModal(false); // Close the modal
        fetchOngoingRequests(); // Refresh the ongoing requests

        // Proceed to start recording after date/time is submitted
        handleRecordingStart();
      } catch (error) {
        console.error('Error saving date and time to Firestore:', error);
      }
    }
  };

  // Fetch ongoing requests on component mount
  useEffect(() => {
    fetchOngoingRequests();
  }, []);

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
                <IonButton fill="solid" color="danger" size="small" routerLink="/tabs/library">
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
                  <IonCardTitle>Ongoing Request(s)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {ongoingRequests.length > 0 ? (
                    ongoingRequests.map((request) => (
                      <p className="request-item" key={request.id}>
                        <span>{request.name}</span>
                        <IonLabel className={request.status === 'Accepted' ? 'accepted-label' : 'pending-label'}>
                          {request.status}
                        </IonLabel>
                      </p>
                    ))
                  ) : (
                    <p>No ongoing requests</p>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Modal for Date and Time Picker */}
        <IonModal isOpen={showDateTimeModal} onDidDismiss={() => setShowDateTimeModal(false)}>
          <IonContent>
            <IonDatetime
              presentation="date-time"
              onIonChange={(e) => setSelectedDateTime(e.detail.value!)}
              value={selectedDateTime}
            />
            <IonButton expand="block" onClick={submitDateTimeToFirestore}>
              Submit Date and Time
            </IonButton>
          </IonContent>
        </IonModal>

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          {isRecording ? (
            <IonFabButton onClick={stopRecording}>
              <IonIcon icon={stopCircleOutline} />
            </IonFabButton>
          ) : (
            <IonFabButton onClick={startRecording}>
              <IonIcon icon={micOutline} />
            </IonFabButton>
          )}
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message="Audio has been recorded and uploaded successfully!"
            duration={2000}
            position="bottom"
          />
        </IonFab>
      </IonContent>

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
                <IonButton fill="clear" routerLink="/tabs/history">
                  <IonIcon icon={peopleOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/library">
                  <IonIcon icon={bookOutline} />
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
