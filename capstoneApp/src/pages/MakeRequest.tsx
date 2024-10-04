import React, { useState, useRef } from 'react';
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
  IonItem,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonText
} from '@ionic/react';
import { micOutline, calendarOutline, chatbubbleEllipsesOutline, playOutline } from 'ionicons/icons';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from './firebaseConfig';
import { useHistory } from 'react-router-dom';

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
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // To track audio playback

  const handleRecordClick = async () => {
    setIsRecording(!isRecording);

    if (!isRecording) {
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
          setmainAudioBlob(audioBlob); // Save the audioBlob for playback
        };
  
        mediaRecorder.start();
      } catch (err) {
        console.error('Error accessing microphone: ', err);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach( track => track.stop() );
        console.log("mic off");
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

  // List of dates in ISO format
  const availableDates = [
    "2024-10-16T20:00:00",
    "2024-10-17T10:00:00",
    "2024-10-18T15:30:00",
    "2024-10-19T18:45:00"
  ];

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
        
        if (mainAudioBlob) {
          await uploadAudioToFirebase(mainAudioBlob); // Upload audio recording
          if (audioUrl) {
            await updateDoc(docRef, {
              [`requests.${selectedDate}.audio`]: audioUrl // Save audio URL under the request
            });
          }
        }

        setShowToast(true); // Show success message
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

  // Convert the ISO date to a human-readable format
  const formatDate = (isoDate: string) => {
    const dateObj = new Date(isoDate);
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

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

      <IonContent>
        {errorMessage && (
          <IonText color="danger" style={{ textAlign: 'center' }}>
            <b><p>{errorMessage}</p></b>
          </IonText>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <IonItem>
            <IonIcon slot="start" icon={calendarOutline} />
            <IonSelect
              placeholder="Select a Date"
              value={selectedDate}
              onIonChange={e => setSelectedDate(e.detail.value)}
            >
              {availableDates.map((isoDate, index) => (
                <IonSelectOption key={index} value={isoDate}>
                  {formatDate(isoDate)} {/* Display human-readable format */}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </div>

        {/* Recording Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <IonButton onClick={handleRecordClick} shape='round'>
            <IonIcon slot="start" icon={micOutline} />
            {isRecording ? "Stop Recording" : "Start Recording"}
          </IonButton>
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
        <div style={{ padding: '20px' }}>
          <IonItem>
            <IonIcon slot="start" icon={chatbubbleEllipsesOutline} />
            <IonTextarea
              placeholder="Type your remarks here..."
              value={remarks}
              onIonInput={e => setRemarks(e.detail.value!)}
            />
          </IonItem>
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
    </IonPage>
  );
};

export default MakeRequest;
