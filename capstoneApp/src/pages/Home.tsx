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
  IonLabel,
  IonToast,
  IonModal,
  IonDatetime,
  useIonRouter,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonButtons,
} from '@ionic/react';
import { micOutline, stopCircleOutline, homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import './Home.css';
import './footer.css'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Route } from 'react-router';
import { storage, db } from './firebaseConfig'; // Ensure Firebase is initialized
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const Home: React.FC = () => {
  const router = useIonRouter();

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const [ongoingRequests, setOngoingRequests] = useState<any[]>([]); // State to store requests

  const currentDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(currentDate.getDate() + 30);

  // Function to start recording after date and time are selected
  const startRecording = async () => {
    // Open the modal for the user to select date and time
    // console.log(roundUpToNearest15Min());
    // console.log(selectedDateTime);
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
      const humanReadableDate = (new Date(selectedDateTime)).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      }); 
      console.log(humanReadableDate);

      try {
        const docRef = doc(db, 'users', storedPhoneNumber);
        await updateDoc(docRef, {
          [`requests.${humanReadableDate}`]: 'Pending'
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

  const toLocalISOString = (date: Date) => {
    const tzOffset = -date.getTimezoneOffset(); // in minutes, negative for UTC- timezones
    const diffHours = Math.floor(tzOffset / 60);
    const diffMinutes = tzOffset % 60;
  
    date.setHours(date.getHours() + diffHours);
    date.setMinutes(date.getMinutes() + diffMinutes);
  
    return date.toISOString().slice(0, 19); // Removes the 'Z' that causes UTC conversion
  };  
  
  const roundUpToNearest15Min = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const remainder = 15 - (minutes % 15); // Calculate how much to add to round to nearest 15
    now.setMinutes(minutes + remainder);   // Add the remainder to get the next 15-minute mark
    now.setSeconds(0, 0);
    return toLocalISOString(now);
  };

  const adjustMinutes = (adjustment) => {
    const currentDate = new Date(selectedDateTime);
    let currentMinutes = currentDate.getMinutes();

    // Adjust minutes by 15 (plus or minus)
    let newMinutes = currentMinutes + adjustment;

    currentDate.setMinutes(newMinutes);
    setSelectedDateTime(toLocalISOString(currentDate));
  };

  // Fetch ongoing requests on component mount
  useEffect(() => {
    const initialDateTime = roundUpToNearest15Min();
    setSelectedDateTime(initialDateTime);
    fetchOngoingRequests();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h1 className='welcomeText'>Welcome!</h1>

        <IonGrid>
          {/* Welcome Section */}
          <IonRow>
            <IonCol>
              <div className="welcome-card">
                <IonLabel className="subtitle">Hot Apps</IonLabel>
                <p>Apps that would be useful for you!</p>
                <IonButton fill="solid" color="danger" size="small" routerLink="/tabs/library">
                  Read more
                </IonButton>
              </div>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonCard className="accepted-requests-card">
                <IonCardHeader>
                  <IonCardTitle>Accepted Requests</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {ongoingRequests.filter(request => request.status === 'Accepted').length > 0 ? (
                    ongoingRequests
                      .filter((request) => request.status === 'Accepted')
                      .map((request) => (
                        <p className="request-item" key={request.name}>
                          <span>{request.name}</span>
                        </p>
                      ))
                  ) : (
                    <p>No accepted requests</p>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonCard className="pending-requests-card">
                <IonCardHeader>
                  <IonCardTitle>Pending Requests</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {ongoingRequests.filter(request => request.status === 'Pending').length > 0 ? (
                    ongoingRequests
                      .filter((request) => request.status === 'Pending')
                      .map((request) => (
                        <p className="request-item" key={request.name}>
                          <span>{request.name}</span>
                        </p>
                      ))
                  ) : (
                    <p>No pending requests</p>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

        </IonGrid>

        <IonModal isOpen={showDateTimeModal} onDidDismiss={() => setShowDateTimeModal(false)}>
          <IonHeader>
            <IonButton onClick={() => setShowDateTimeModal(false)}>
              Back
            </IonButton>
          </IonHeader>
          <IonContent>
            <h2 style={{ padding: '10px' }}>Please select a timing when you are available to meet with the HWN volunteers</h2>
            <IonDatetime
              presentation="date-time"
              onIonChange={(e) => setSelectedDateTime(e.detail.value!)}
              value={selectedDateTime}
              min={new Date().toISOString()}
              max={maxDate.toISOString()}
              minuteValues='0,15,30,45,60'
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <IonButton onClick={() => adjustMinutes(-60)}>- 1 Hr</IonButton>
              <IonButton onClick={() => adjustMinutes(-15)}>- 15 Min</IonButton>
              <IonButton onClick={() => adjustMinutes(15)}>+ 15 Min</IonButton>
              <IonButton onClick={() => adjustMinutes(60)}>+ 1 Hr</IonButton>
            </div>
            <IonButton expand="block" onClick={submitDateTimeToFirestore}>
              Submit Date and Time
            </IonButton>
          </IonContent>
        </IonModal>


        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          {isRecording ? (
            <IonFabButton onClick={stopRecording} style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
              <IonIcon icon={stopCircleOutline} style={{ fontSize: '36px' }} />
            </IonFabButton>
          ) : (
            <IonFabButton onClick={startRecording} style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
              <IonIcon icon={micOutline} style={{ fontSize: '36px' }} />
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

      <IonToolbar>
        <IonTabs>
          <IonRouterOutlet>
            {/* Define your routes here */}
            <Route path="/tabs/home" exact={true} />
            <Route path="/tabs/history" exact={true} />
            <Route path="/tabs/library" exact={true} />
            <Route path="/tabs/settings" exact={true} />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/tabs/home">
              <IonIcon icon={homeOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>

            <IonTabButton tab="history" href="/tabs/history">
              <IonIcon icon={peopleOutline} style={{ fontSize: '28px' }} />
              <IonLabel>History</IonLabel>
            </IonTabButton>

            <IonTabButton tab="library" href="/tabs/library">
              <IonIcon icon={bookOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Library</IonLabel>
            </IonTabButton>

            <IonTabButton tab="settings" href="/tabs/settings">
              <IonIcon icon={settingsOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonToolbar>

    </IonPage>
  );
};

export default Home;
