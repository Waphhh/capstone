import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
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
  IonLoading,
  IonToast
} from '@ionic/react';
import { db, storage } from './firebaseConfig';
import { add, closeOutline } from 'ionicons/icons';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import TabsToolbar from './TabsToolbar';
import { useTranslation } from 'react-i18next';
import Joyride from 'react-joyride';

import './ElderlyRequests.css';
import { fetchUserLanguage } from './GetLanguage';
import Calendar from './Calendar';
import ContentSeparator from './ContentSeparator';

const ElderlyRequests: React.FC = () => {
  const { t } = useTranslation();
  
  const history = useHistory();
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(true);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  const [requests, setRequests] = useState<any[]>([]);
  const [completedRequests, setCompletedRequests] = useState<any>({});
  const [showAlert, setShowAlert] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [remakeRequestDate, setRemakeRequestDate] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isRemakeModalOpen, setIsRemakeModalOpen] = useState(false);
  const [uploading, setupLoading] = useState(false);
  const [runFirstTutorial, setRunFirstTutorial] = useState(false);
  const [runSecondTutorial, setRunSecondTutorial] = useState(false);

  const Tutorial = localStorage.getItem("Tutorial");
  const tutorialCompleted = localStorage.getItem("tutorialCompletedRequests");

  // Steps for the first tutorial
  const firstTutorialSteps = [
    {
      target: '.plus-button',
      content: 'Click here to start a new request!',
    },
  ];

  // Steps for the second tutorial (modal)
  const secondTutorialSteps = [
    {
      target: '.modal-content',
      content: 'Select the app you need help with.',
    },
  ];

  const options = [
    { id: 1, label: 'WhatsApp', src: 'Whatsapp.png'},
    { id: 2, label: 'Facebook', src: 'Facebook.png'},
    { id: 3, label: 'Youtube', src: 'Youtube.png'},
    { id: 4, label: 'MyTransport', src: 'MyTransport.png'},
    { id: 5, label: 'Healthy365', src: 'Healthy365_logo.png'},
    { id: 6, label: 'Grab', src: 'Grab.png'},
    { id: 7, label: 'Other', src: 'Other.png'},

  ];

  const handleConfirm = () => {
    if (selectedOption) {
      // Save the selected option to localStorage
      localStorage.setItem('selectedOption', selectedOption);
      closeNewRequestModal();
      history.push('/tabs/makerequest');
    }
  };

  const closeNewRequestModal = () => {
    setIsNewRequestModalOpen(false);
  };

  const closeRemakeModal = () => {
    setIsRemakeModalOpen(false);
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
  
          const ongoingRequestsArray: React.SetStateAction<any[]> = [];
          const completedRequestsDict: { [isoDate: string]: any } = {}; // Dictionary for completed requests
  
          // Fetch requests and handle them based on their status
          await Promise.all(
            Object.keys(userRequests).map(async (key) => {
              const requestData = userRequests[key];
              const remarksForRequest = userRemarks[key];
  
              if (requestData === 'Completed') {
                // Add completed request to the dictionary with ISO date as key
                completedRequestsDict[key] = {
                  status: requestData,
                  remarks: remarksForRequest // Add remarks to the completed request
                };
              } else {
                const fileName = `recordings/${storedPhoneNumber}_${key}.wav`;
                const audioRef = ref(storage, fileName);
  
                try {
                  // Attempt to get the download URL, if it exists
                  const audioUrl = await getDownloadURL(audioRef);
  
                  // Add ongoing request with audio URL
                  ongoingRequestsArray.push({
                    name: key,
                    status: requestData,
                    audioUrl, // Store the audio URL for playing
                    remarks: remarksForRequest // Add remarks to the request
                  });
                } catch (error) {
                  if (error.code === 'storage/object-not-found') {
                    console.log(`No recording found for request: ${key}`);
  
                    // Add ongoing request without audio URL if no recording is found
                    ongoingRequestsArray.push({
                      name: key,
                      status: requestData,
                      audioUrl: null, // No audio URL
                      remarks: remarksForRequest // Add remarks to the request
                    });
                  } else {
                    console.error('Error fetching audio URL:', error);
                  }
                }
              }
            })
          );
  
          // Sort the ongoing requests by date
          ongoingRequestsArray.sort((a, b) => new Date(a.name) - new Date(b.name));
          setRequests(ongoingRequestsArray); // Set the ongoing requests array
  
          // Set the completed requests dictionary without sorting
          setCompletedRequests(completedRequestsDict); // Set the completed requests dictionary
          console.log(completedRequestsDict);
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

          requestsArray.sort((a, b) => new Date(b.key) - new Date(a.key));
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

  const remakeRequest = async (pastRequest: string) => {
    setRemakeRequestDate(pastRequest);
    setIsRemakeModalOpen(true);
  }

  const handleCalendarClick = async (isoDate: string) => {
    console.log('Calendar clicked for date:', isoDate);

    console.log(completedRequests);

    if (remakeRequestDate) {
      console.log(completedRequests[remakeRequestDate]);
      const finalRemarks = completedRequests[remakeRequestDate].remarks + ` (Remake request, past request date is ${remakeRequestDate})`;
      console.log(finalRemarks);

      if (storedPhoneNumber && isoDate) {

        setupLoading(true);
        try {
          const docRef = doc(db, 'users', storedPhoneNumber);
          await updateDoc(docRef, {
            [`requests.${isoDate}`]: 'Pending',
            [`remarks.${isoDate}`]: finalRemarks
          });
  
          const dateRef = doc(db, 'dates', 'dates');
          await updateDoc(dateRef, {
            [`dates.${isoDate}`]: increment(1)
          });
  
          setShowToast(true); // Show success message
          closeRemakeModal();
        } catch (error) {
          console.error('Error saving date, remarks, or audio to Firestore:', error);
        } finally {
          setupLoading(false);
        }
      }

    } else {
      console.error("No past request selected.")
    }
    
  };

  const handleCancelRequest = async (requestName: string) => {
    try {
      setCancelling(true);

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

        const dateRef = doc(db, 'dates', 'dates');
        await updateDoc(dateRef, {
          [`dates.${requestName}`]: increment(-1)
        });
  
        // Update Firestore document
        await updateDoc(docRef, { requests: updatedRequests, remarks: updatedRemarks });
  
        // Update the UI by removing the request from state
        setRequests((prevRequests) => prevRequests.filter((req) => req.name !== requestName));
        console.log(`Request "${requestName}" has been canceled and audio file deleted (if it existed).`);
      }
    } catch (error) {
      console.error('Error canceling the request and deleting the audio file:', error);
    }
    setCancelling(false);
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

  const handleOpenModal = () => {
    setIsNewRequestModalOpen(true);
  };

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setRunFirstTutorial(false);
      setIsNewRequestModalOpen(true);
      setRunSecondTutorial(true);
      localStorage.setItem("tutorialCompletedRequests", "true");
    }
  };

  const handleJoyrideCallback2 = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setRunSecondTutorial(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchOngoingRequests();
    setSelectedOption("");
    
    if (localStorage.getItem("immediateRequest") !== null) {
      setIsNewRequestModalOpen(true);
      localStorage.removeItem("immediateRequest");
    }
    
  }, [location]);

  useEffect(() => {
    fetchOngoingRequests();
  }, [uploading]);

  useEffect(() => {
    if (selectedOption !== null) {
      handleConfirm();
    }
  }, [selectedOption]);

  useEffect(() => {
    const loadUserLanguage = async () => {
      const success = await fetchUserLanguage(db); // Call the function and await its result
      setLoading(!success); // Set loading to true if fetching failed, false if successful
    };

    loadUserLanguage();

    if (Tutorial && !tutorialCompleted) {
      setRunFirstTutorial(true);
    }

  }, [db]);

  if (loading) return <p>{t("Loading...")}</p>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{t("Requests")}</IonTitle>
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
                <IonCard key={index} className="request-card">
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
                          <h2 style={{ fontWeight: 'bold' }}>{t("New Request")}</h2>
                          <h2 className="time">{time}</h2>
                          <h3 style={{ color: statusColor, fontWeight: 'bold' }}>Status: {request.status}</h3>
                          <h3>{request.remarks}</h3>

                          {/* Conditionally disable Play Recording button and change text if audioUrl is null */}
                          <IonButton
                            expand="block"
                            fill="solid"
                            color="tertiary"
                            className="action-button"
                            onClick={() => playAudio(request.audioUrl)}
                            disabled={!request.audioUrl} // Disable if no audioUrl
                          >
                            {request.audioUrl ? t("Play Recording") : t("No Recording")} {/* Change button text */}
                          </IonButton>

                          <IonButton
                            expand="block"
                            fill="outline"
                            color="primary"
                            className="action-button"
                            onClick={() => {
                              setSelectedRequest(request.name);
                              setShowAlert(true);
                            }}
                          >
                            {t("Cancel")}
                          </IonButton>
                        </IonCardContent>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCard>
              );
            })
          ) : (
            <p>{t("No requests")}</p>
          )}
        </IonGrid>

        <ContentSeparator text={t("History")} />

        <IonGrid>
          {userHistory.length > 0 ? (
            userHistory.map((item, index) => (
              <IonCard key={index} style={{ backgroundColor: 'var(--accent-50)' }}>
                <IonCardContent style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{item.historyItem}</h4>
                    <p>{formatComment(item.comment)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <IonButton shape='round' onClick={() => remakeRequest(item.historyItem)}>
                      Re-request
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          ) : (
            <p>{t("No history items found.")}</p>
          )}
        </IonGrid>

        <IonModal isOpen={isRemakeModalOpen} onDidDismiss={closeRemakeModal}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{t("Remake previous request")}</IonTitle>
              <IonButtons slot="end" onClick={closeRemakeModal}>
                <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ textAlign: 'center' }}>

          <h3>{t("Choose a time when you are free.")}</h3>

          <Calendar handleCalendarClick={handleCalendarClick}/>

          </IonContent>

        </IonModal>

        <Joyride 
          steps={firstTutorialSteps}
          run={runFirstTutorial}
          continuous
          showSkipButton
          callback={handleJoyrideCallback}
          styles={{
            options: {
              arrowColor: 'var(--accent-100)',
              backgroundColor: 'var(--accent-100)',
              primaryColor: 'var(--primary-300)',
              textColor: 'var(--text)',
            },
          }}
        />

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton className="plus-button" onClick={handleOpenModal} style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
            <IonIcon icon={add} style={{ fontSize: '36px' }} />
          </IonFabButton>
        </IonFab>

      </IonContent>

      <IonAlert
        isOpen={showAlert}
        header={t("Are you sure you want to cancel this request?")}
        message={t("The request and recording will be permanently deleted.")}
        buttons={[
          {
            text: t("Yes, delete this request"),
            role: "confirm",
            handler: () => handleCancelRequest(selectedRequest as string)
          },
          {
            text: t("No, do not delete"),
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
          <IonToolbar color="primary">
            <IonTitle>{t("New Request")}</IonTitle>
            <IonButtons slot="end" onClick={closeNewRequestModal}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <Joyride 
          steps={secondTutorialSteps}
          run={runSecondTutorial}
          continuous
          showSkipButton
          callback={handleJoyrideCallback2}
          styles={{
            options: {
              arrowColor: 'var(--accent-100)',
              backgroundColor: 'var(--accent-100)',
              primaryColor: 'var(--primary-300)',
              textColor: 'var(--text)',
            },
          }}
        />

        <IonContent style={{ textAlign: 'center' }}>
          <h3 className="modal-content">{t("What do you need help learning?")}</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)', // 2 columns
              gap: '16px', // space between items
              justifyItems: 'center', // center items horizontally
              alignItems: 'center', // center items vertically
              padding: '16px'
            }}
          >
            {options.map(option => (
              <div
                key={option.id}
                onClick={() => setSelectedOption(option.label)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  backgroundColor: 'var(--accent-50)',
                  padding: '16px',
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px'
                }}
              >
                <img
                  src={`iconassets/${option.src}`}
                  alt={option.label}
                  style={{ 
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain', 
                    margin: 'auto'
                  }}                
                />
                <IonLabel style={{ fontSize: '20px', display: 'block', marginTop: '8px', fontWeight: '600' }}>
                  {option.label}
                </IonLabel>
              </div>
            ))}
          </div>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={cancelling} message={t("Cancelling request...")} />

      <IonToast
        isOpen={showToast}
        message={t("Request submitted successfully!")}
        duration={2000}
        onDidDismiss={() => setShowToast(false)}
      />

      <IonLoading isOpen={uploading} message={t("Request uploading...")} />

      <TabsToolbar />

    </IonPage>
  );
};

export default ElderlyRequests;
