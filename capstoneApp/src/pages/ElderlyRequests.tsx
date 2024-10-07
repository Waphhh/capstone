import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonLabel,
  IonRouterLink,
  IonButton,
  IonAlert,
  IonButtons,
  IonModal,
  IonFab,
  IonFabButton,
  IonItem,
  IonList
} from '@ionic/react';
import { db, storage } from './firebaseConfig';
import { add, closeOutline } from 'ionicons/icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import TabsToolbar from './TabsToolbar';

import './ElderlyRequests.css';

const ElderlyRequests: React.FC = () => {

  const [userHistory, setUserHistory] = useState<any[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  const [requests, setRequests] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const history = useHistory();

  const options = [
    { id: 1, label: 'Whatsapp'},
    { id: 2, label: 'Facebook'},
    { id: 3, label: 'Youtube'},
    { id: 4, label: 'Healthy365'},
    { id: 5, label: 'Singpass'},
    { id: 6, label: 'Grab'},
    { id: 7, label: 'Other'},

    // Add more options as needed
  ];

  const handleConfirm = () => {
    if (selectedOption) {
      // Save the selected option to localStorage
      localStorage.setItem('selectedOption', selectedOption);
      console.log(selectedOption);
      closeNewRequestModal();
      history.push('/tabs/makerequest');
    }
  };  

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeNewRequestModal = () => {
    setIsNewRequestModalOpen(false);
  };

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

  const fetchOngoingRequests = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userRequests = userData.requests || {};
          const userRemarks = userData.remarks || {}; // Fetch the remarks field
  
          // Fetch requests and filter out completed ones
          const requestsArray = await Promise.all(
            Object.keys(userRequests).map(async (key) => {
              const requestData = userRequests[key];
              console.log(key);
  
              // Check if the request status is not completed
              if (requestData !== 'Completed') {
                const fileName = `recordings/${storedPhoneNumber}_${key}.wav`;
                const audioRef = ref(storage, fileName);
                
                try {
                  // Attempt to get the download URL, if it exists
                  const audioUrl = await getDownloadURL(audioRef);
                  const remarksForRequest = userRemarks[key]
  
                  return {
                    name: key,
                    status: requestData,
                    audioUrl, // Store the audio URL for playing
                    remarks: remarksForRequest // Add remarks to the request
                  };
                } catch (error) {
                  if (error.code === 'storage/object-not-found') {
                    console.log(`No recording found for request: ${key}`);
                    const remarksForRequest = userRemarks[key]
  
                    // Return request without audioUrl if no recording is found
                    return {
                      name: key,
                      status: requestData,
                      audioUrl: null, // No audio URL
                      remarks: remarksForRequest // Add remarks to the request
                    };
                  } else {
                    console.error('Error fetching audio URL:', error);
                  }
                }
              }
  
              // Return null for completed requests
              return null;
            })
          );
  
          // Filter out null values from the array
          const filteredRequests = requestsArray.filter(request => request !== null);
          filteredRequests.sort((a, b) => new Date(a.name) - new Date(b.name));
          setRequests(filteredRequests); // Set the requests array with audio URLs and remarks
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
  

  // Function to fetch requests from Firestore for the current user
  const fetchHistory = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const history = userData.history || {};
          const requestsArray = Object.keys(history).map((key) => ({
            historyItem: key,
            comment: history[key],
          }));

          setUserHistory(requestsArray);
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

  const handleCancelRequest = async (requestName: string) => {
    try {
      const docRef = doc(db, 'users', storedPhoneNumber as string);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const updatedRequests = { ...userData.requests };
        const updatedRemarks = { ...userData.remarks };
  
        // Check if the request has a recording and get its details
        const requestDetails = updatedRequests[requestName];
  
        // If the request has a recording, delete the audio file
        if (requestDetails && requestDetails.audioUrl) {
          const fileName = `recordings/${storedPhoneNumber}_${requestName}.wav`;
          const audioRef = ref(storage, fileName);  // Reference to the audio file in Firebase Storage
  
          // Delete the audio file from Firebase Storage
          await deleteObject(audioRef);
        }
  
        // Remove the request and its remarks from the user's requests
        delete updatedRequests[requestName];
        delete updatedRemarks[requestName];
  
        // Update Firestore document
        await updateDoc(docRef, { requests: updatedRequests, remarks: updatedRemarks });
  
        // Update the UI by removing the request from state
        setRequests((prevRequests) => prevRequests.filter((req) => req.name !== requestName));
        console.log(`Request "${requestName}" has been canceled and audio file deleted (if it existed).`);
      }
    } catch (error) {
      console.error('Error canceling the request and deleting the audio file:', error);
    }
  };  

  // Function to convert URLs in comments to clickable links
  const formatComment = (comment: string) => {
    // Regular expression to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

    return comment.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        // Ensure correct URL format (add http if missing)
        const formattedLink = part.startsWith('http') ? part : `http://${part}`;

        // Check if the part ends with '.' or ',' and trim it
        const cleanedPart = part.replace(/[.,]+$/, '');

        return (
          <IonRouterLink key={index} href={formattedLink} target="_blank">
            {cleanedPart}
          </IonRouterLink>
        );
      } else {
        return part;
      }
    });
  };

  const playAudio = (url: string) => {
    // Reset audioUrl first to trigger re-rendering of the audio element
    setAudioUrl(null);
    setTimeout(() => {
      setAudioUrl(url);
    }, 100);  // Short delay to ensure the audio element resets
  };

  useEffect(() => {
    fetchHistory();
    fetchOngoingRequests();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Requests</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          {requests.length > 0 ? (
            requests.map((request, index) => {
              const { dayOfWeek, day, month, year, time } = formatDate(request.name);
              // Determine the status color
              const statusColor = request.status === "accepted" ? "green" : "red"; // Set color based on status

              return (
                <IonCard key={index} className="request-card" style={{ backgroundColor: '#f0f0f0' }}>
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
                          <h2>New Request</h2>
                          <h2 className="time">{time}</h2>
                          <h3 style={{ color: statusColor }}>Status: {request.status}</h3>
                          <h3>Remarks: {request.remarks}</h3>

                          {/* Conditionally disable Play Recording button and change text if audioUrl is null */}
                          <IonButton
                            expand="block"
                            fill="solid"
                            color="secondary"
                            className="action-button"
                            onClick={() => playAudio(request.audioUrl)}
                            disabled={!request.audioUrl} // Disable if no audioUrl
                          >
                            {request.audioUrl ? "Play Recording" : "No Recording"} {/* Change button text */}
                          </IonButton>

                          <IonButton
                            expand="block"
                            fill="outline"
                            color="danger"
                            className="action-button"
                            onClick={() => {
                              setSelectedRequest(request.name);
                              setShowAlert(true);
                            }}
                          >
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
            <p>No requests</p>
          )}
        </IonGrid>

        <IonButton expand="full" shape='round' onClick={() => setIsModalOpen(true)} style={{ margin: '10px' }}>
          Show History
        </IonButton>

        <IonModal isOpen={isModalOpen} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar color="danger">
              <IonTitle>History Items</IonTitle>
              <IonButtons slot="end" onClick={closeModal}>
                <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonGrid>
              {userHistory.length > 0 ? (
                userHistory.map((item, index) => (
                  <IonCard key={index}>
                    <IonCardContent>
                      <h4>{item.historyItem}</h4>
                      <p>{formatComment(item.comment)}</p>
                    </IonCardContent>
                  </IonCard>
                ))
              ) : (
                <p>No history items found.</p>
              )}
            </IonGrid>
          </IonContent>
        </IonModal>

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={() => setIsNewRequestModalOpen(true)} style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
            <IonIcon icon={add} style={{ fontSize: '36px' }} />
          </IonFabButton>
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

      <IonModal isOpen={isNewRequestModalOpen} onDidDismiss={closeNewRequestModal}>
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>New Request</IonTitle>
            <IonButtons slot="end" onClick={closeNewRequestModal}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ textAlign: 'center' }}>
          <h2>What do you need help learning?</h2>
          <IonList>
            {options.map(option => (
              <IonItem
                key={option.id}
                button
                onClick={() => setSelectedOption(option.label)}
                style={{
                  backgroundColor: selectedOption === option.label ? 'blue' : 'transparent', // Change background color for selected option
                  color: selectedOption === option.label ? 'blue' : 'black', // Change text color for selected option
                  paddingRight: '16px'
                }}
              >
                <IonLabel style={{ fontSize: '40px' }}>{option.label}</IonLabel>
              </IonItem>
            ))}
          </IonList>
          <IonButton expand="full" onClick={handleConfirm} disabled={!selectedOption}>
            Confirm
          </IonButton>
        </IonContent>
      </IonModal>

      <TabsToolbar />

    </IonPage>
  );
};

export default ElderlyRequests;
