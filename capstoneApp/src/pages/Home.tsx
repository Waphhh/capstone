import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonCard, IonCardContent, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonAlert, IonContent, IonDatetime, IonFab, IonFabButton, IonIcon, IonLabel, IonModal, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, IonToast, useIonRouter, IonFooter } from '@ionic/react';
import './HomeIteration.css';  
import { doc, getDoc, updateDoc } from 'firebase/firestore';  
import { ref, deleteObject, getDownloadURL, uploadBytes } from 'firebase/storage';  // Import getDownloadURL
import { storage, db } from './firebaseConfig';  
import { addOutline, stopCircleOutline, homeOutline, peopleOutline, bookOutline, settingsOutline } from 'ionicons/icons';
import { Route } from 'react-router';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    year: date.getFullYear(),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  };
};

const RequestCard: React.FC = () => {
  const router = useIonRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber'); 

  const currentDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(currentDate.getDate() + 30);

  const fetchOngoingRequests = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userRequests = userData.requests || {};
  
          // Fetch requests and filter out completed ones
          const requestsArray = await Promise.all(
            Object.keys(userRequests).map(async (key) => {
              const requestData = userRequests[key];
  
              // Check if the request status is not completed
              if (requestData !== 'Completed') {
                const fileName = `recordings/${storedPhoneNumber}_${key}.wav`;
                const audioRef = ref(storage, fileName);
                const audioUrl = await getDownloadURL(audioRef); // Get the download URL for each request
                return {
                  name: key,
                  status: requestData,
                  audioUrl // Store the audio URL for playing
                };
              }
  
              // Return null for completed requests
              return null;
            })
          );
  
          // Filter out null values from the array
          const filteredRequests = requestsArray.filter(request => request !== null);
          filteredRequests.sort((a, b) => new Date(a.name) - new Date(b.name));
          setRequests(filteredRequests); // Set the requests array with audio URLs
        } else {
          console.log('No such document!');
        }
      } else {
        console.log('Phone number not found in localStorage');
      }
    } catch (error) {
      console.error('Error fetching ongoing requests:', error);
    }
  };
  
  const handleCancelRequest = async (requestName: string) => {
    try {
      const docRef = doc(db, 'users', storedPhoneNumber as string);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const updatedRequests = { ...userData.requests };
        
        // Construct the filename to delete
        const fileName = `recordings/${storedPhoneNumber}_${requestName}.wav`;
        const audioRef = ref(storage, fileName);  // Reference to the audio file in Firebase Storage
  
        // Delete the audio file from Firebase Storage
        await deleteObject(audioRef);
  
        // Remove the request from the user's requests
        delete updatedRequests[requestName];
  
        // Update Firestore document
        await updateDoc(docRef, { requests: updatedRequests });
  
        // Update the UI by removing the request from state
        setRequests((prevRequests) => prevRequests.filter((req) => req.name !== requestName));
        console.log(`Request "${requestName}" has been canceled and audio file deleted.`);
      }
    } catch (error) {
      console.error('Error canceling the request and deleting the audio file:', error);
    }
  };  

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
      mediaRecorderRef.current.stream.getTracks().forEach( track => track.stop() );
      console.log("mic off");
      setIsRecording(false);
      fetchOngoingRequests();
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

  const toLocalISOString = (date: Date) => {
    date.setHours(date.getHours() + 8);

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

  const playAudio = (url: string) => {
    // Reset audioUrl first to trigger re-rendering of the audio element
    setAudioUrl(null);
    setTimeout(() => {
      setAudioUrl(url);
    }, 100);  // Short delay to ensure the audio element resets
  };

  useEffect(() => {
    console.log("refresh");
    const initialDateTime = roundUpToNearest15Min();
    setSelectedDateTime(initialDateTime);
    fetchOngoingRequests();
  }, []);

  return (
    <IonPage style={{ backgroundColor: 'white' }}>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={true}>
        <IonGrid style={{ margin: '5px' }}>
          {requests.length > 0 ? (
            requests.map((request, index) => {
              const { dayOfWeek, day, month, year, time } = formatDate(request.name);
              return (
                <IonCard key={index} className="request-card" style={{ margin: '10px', backgroundColor: '#f0f0f0' }}>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="3" className="date-section">
                        <div className="date-block">
                          <p className="day">{dayOfWeek}</p>
                          <h2 className="date">{day}</h2>
                          <p className="month">{month}</p>
                          <p className="year">{year}</p>
                        </div>
                      </IonCol>

                      <IonCol size="9" className="info-section">
                        <IonCardContent>
                          <h3>New Request</h3>
                          <h3 className="time">{time}</h3>
                          <h4>Status: {request.status}</h4>

                          <IonButton expand="block" fill="solid" color="secondary" className="action-button" onClick={() => playAudio(request.audioUrl)}>
                            Play Recording
                          </IonButton>

                          <IonButton expand="block" fill="outline" color="danger" className="action-button" onClick={() => {
                            setSelectedRequest(request.name);
                            setShowAlert(true);
                          }}>
                            Cancel
                          </IonButton>
                        </IonCardContent>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCard>
              );
            })
          ) : (
            <p>No ongoing requests</p>
          )}
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
              <IonIcon icon={addOutline} style={{ fontSize: '36px' }} />
            </IonFabButton>
          )}
          <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message="Audio has been recorded and uploaded successfully!" duration={2000} position="bottom" />
        </IonFab>
      </IonContent>

      <IonAlert
        isOpen={showAlert}
        header="Are you sure you want to cancel this request?"
        message="The request and recording will be permanently deleted."
        buttons={[
          {
            text: "Yes, delete this request",
            role: "confirm",
            handler: () => handleCancelRequest(selectedRequest as string)
          },
          {
            text: "No",
            role: "cancel",
            handler: () => {
              setShowAlert(false); // Close alert
              console.log("Delete cancelled");
            }
          }
        ]}
        onDidDismiss={() => setShowAlert(false)} // Close alert on dismiss
      />

      {audioUrl && (
        <audio autoPlay src={audioUrl} style={{ display: 'none' }}>
          Your browser does not support the audio element.
        </audio>
      )}

      <IonFooter>
        <IonToolbar>
          <IonTabs>
            <IonRouterOutlet>
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
      </IonFooter>
    </IonPage>

  );
};

export default RequestCard;
