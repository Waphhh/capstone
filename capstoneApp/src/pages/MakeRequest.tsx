import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonTextarea,
  IonToast,
  IonText,
  IonModal,
  IonFabButton
} from '@ionic/react';
import { micOutline, chatbubbleEllipsesOutline, playOutline, closeOutline, calendarOutline, stopOutline } from 'ionicons/icons';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from './firebaseConfig';
import { useHistory } from 'react-router-dom';
import { LiveAudioVisualizer } from 'react-audio-visualize';
import Calendar from './Calendar';

const MakeRequest: React.FC = () => {
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const whatToLearn = localStorage.getItem('selectedOption');
  const history = useHistory(); // Get the history object for navigation
  
  const [remarks, setRemarks] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mainAudioBlob, setmainAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaRecorderReady, setIsMediaRecorderReady] = useState<boolean>(false); // New state to control visualizer rendering

  const handleRecordClick = async () => {
    setIsRecording(!isRecording);

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        // Set state to indicate media recorder is ready
        setIsMediaRecorderReady(true);

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setmainAudioBlob(audioBlob); // Save the audioBlob for playback
        };

        mediaRecorder.start();
      } catch (err) {
        console.error('Error accessing microphone: ', err);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        console.log("mic off");
        setIsMediaRecorderReady(false); // Reset the state when recording stops
      }
    }
  };

  const handleAudioPlay = () => {
    if (mainAudioBlob) {
      const audioUrl = URL.createObjectURL(mainAudioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);

      audio.onended = () => setIsPlaying(false); // Reset the state once the audio finishes playing
    }
  };

  const uploadAudioToFirebase = async (audioBlob: Blob) => {
    const fileName = 'recordings/' + storedPhoneNumber + '_' + selectedDate + '.wav';
    const storageRef = ref(storage, fileName);

    try {
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setAudioUrl(downloadURL); // Save audio URL after upload
    } catch (error) {
      console.error('Error uploading audio to Firebase:', error);
    }
  };

  // Submit the selected date and remarks to Firestore
  const submitDateTimeToFirestore = async () => {
    if (!selectedDate) {
      setErrorMessage('Please select a date');
      return;
    }

    if (whatToLearn === 'Other' && remarks.trim() === "" && !mainAudioBlob) {
      setErrorMessage('Remarks and voice recording cannot both be empty for "Other".');
      return; // Prevent submission
    }

    setErrorMessage('');

    if (storedPhoneNumber && selectedDate) {

      const finalRemarks = `Option selected: ${whatToLearn}. Remarks: ${remarks.trim() === "" ? "N.A." : remarks}`;

      try {
        const docRef = doc(db, 'users', storedPhoneNumber);
        await updateDoc(docRef, {
          [`requests.${selectedDate}`]: 'Pending',
          [`remarks.${selectedDate}`]: finalRemarks
        });

        const dateRef = doc(db, 'dates', 'dates');
        await updateDoc(dateRef, {
          [`dates.${selectedDate}`]: increment(1)
        });
        
        if (mainAudioBlob) {
          await uploadAudioToFirebase(mainAudioBlob); // Upload audio recording
          if (audioUrl) {
            await updateDoc(docRef, {
              [`requests.${selectedDate}.audio`]: audioUrl // Save audio URL under the request
            });
          }
        }

        setShowToast(true); // Show success message
        closerequestpart2();
        history.push('/tabs/elderlyrequests');
      } catch (error) {
        console.error('Error saving date, remarks, or audio to Firestore:', error);
      }
    }
  };

  const handleSubmit = () => {
    console.log("Remarks submitted: ", remarks);
    console.log("Selected Date: ", selectedDate);
    submitDateTimeToFirestore();
  };

  const handleCalendarClick = (isoDate: string) => {
    setSelectedDate(isoDate);
    console.log('Calendar clicked for date:', isoDate);
  };

  const closerequestpart2 = () => {
    setIsModalOpen(false);
  };

  const handleDateSelect = () => {
  if (selectedDate) {
    setIsModalOpen(true);
  } else {
    setErrorMessage('Please select a date');
    return;
  }
  }

  const formattedDate = (new Date(selectedDate)).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })

  useEffect(() => {
    if (isMediaRecorderReady) {
      console.log('LiveAudioVisualizer should now render, mediaRecorderRef:', mediaRecorderRef.current);
    }
  }, [isMediaRecorderReady]); 

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/elderlyrequests" />
          </IonButtons>
          <IonTitle>{whatToLearn} Request</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ textAlign: 'center' }}>

        <h3>Select a timing when you are available.</h3>

        {errorMessage && (
          <IonText color="danger" style={{ textAlign: 'center' }}>
            <b><p>{errorMessage}</p></b>
          </IonText>
        )}

        <Calendar handleCalendarClick={handleCalendarClick}/>

        <IonButton onClick={handleDateSelect} style={{ marginTop: '20px' }}>Choose this date</IonButton>

      </IonContent>

      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>Specify problem</IonTitle>
            <IonButtons slot="end" onClick={closerequestpart2}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <IonIcon icon={calendarOutline} style={{ fontSize: '50px'}}/>
            <p style={{ fontSize: '24px', paddingRight: '15px', paddingLeft: '15px', marginTop: '0px' }}>Selected timing: {formattedDate}</p>
          </div>

          {/* Recording Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <IonFabButton onClick={handleRecordClick} style={{ borderRadius: '50%', width: '64px', height: '64px' }}>
              <IonIcon icon={isRecording ? stopOutline : micOutline} style={{ fontSize: '48px' }} />
            </IonFabButton>
          </div>

          <div>
            {isMediaRecorderReady && mediaRecorderRef.current && (
              <LiveAudioVisualizer
                mediaRecorder={mediaRecorderRef.current}
                width={200}
                height={75}
              />
            )}
          </div>

          {/* Display recording status if recording is active */}
          {isRecording && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <p>Recording in progress...</p>
            </div>
          )}

          {/* Play Audio Button */}
          {mainAudioBlob && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <IonButton onClick={handleAudioPlay} disabled={isPlaying} shape='round'>
                <IonIcon slot="start" icon={playOutline} />
                {isPlaying ? "Playing..." : "Play Recording"}
              </IonButton>
            </div>
          )}

          {/* Remarks Section */}
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <IonIcon icon={chatbubbleEllipsesOutline} style={{ fontSize: '50px' }}/>
            <IonTextarea
              placeholder="Type your remarks here..."
              value={remarks}
              onIonInput={e => setRemarks(e.detail.value!)}
            />
            <IonButton expand="block" color="primary" onClick={handleSubmit} style={{ marginTop: '10px' }} shape='round'>
              Submit Request
            </IonButton>
          </div>

          <IonToast
            isOpen={showToast}
            message="Request submitted successfully!"
            duration={2000}
            onDidDismiss={() => setShowToast(false)}
          />
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default MakeRequest;
