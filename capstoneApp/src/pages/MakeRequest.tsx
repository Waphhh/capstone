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
  IonFabButton,
  useIonViewWillLeave,
  IonLoading
} from '@ionic/react';
import { micOutline, chatbubbleEllipsesOutline, playOutline, closeOutline, calendarOutline, stopOutline } from 'ionicons/icons';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from './firebaseConfig';
import { useHistory } from 'react-router-dom';
import { LiveAudioVisualizer } from 'react-audio-visualize';
import Calendar from './Calendar';
import { useTranslation } from 'react-i18next';
import { fetchUserLanguage } from './GetLanguage';

const MakeRequest: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation

  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const whatToLearn = localStorage.getItem('selectedOption');
  const history = useHistory(); // Get the history object for navigation
  
  const [loading, setLoading] = useState<boolean>(true);
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
  const [isMediaRecorderReady, setIsMediaRecorderReady] = useState<boolean>(false);
  const [uploading, setupLoading] = useState(false);

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
    const audioSizeLimit = 5 * 1024 * 1024; // 5 MB limit in bytes

    if (!selectedDate) {
      setErrorMessage(t('Please select a date'));
      return;
    }

    if (whatToLearn === 'Other' && remarks.trim() === "" && !mainAudioBlob) {
      setErrorMessage(t('Remarks and voice recording cannot both be empty for "Other".'));
      return; // Prevent submission
    }

    if (remarks.trim().length > 100 ) {
      setErrorMessage(t('Please keep you remarks to below 100 characters.'));
      return; // Prevent submission
    }

    if (mainAudioBlob && mainAudioBlob.size > audioSizeLimit) {
      setErrorMessage(t('Audio recording exceeds the size limit of 5 MB. Please record a shorter message.'));
      return; // Prevent submission
    }  

    setErrorMessage('');

    if (storedPhoneNumber && selectedDate) {

      const finalRemarks = `Option selected: ${whatToLearn}. Remarks: ${remarks.trim() === "" ? "N.A." : remarks}`;

      setupLoading(true);
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
        history.push('/tabs/elderlyrequests');
        closerequestpart2();
      } catch (error) {
        console.error('Error saving date, remarks, or audio to Firestore:', error);
      } finally {
        setupLoading(false);
        setmainAudioBlob(null);
        setSelectedDate("");
        setRemarks("");
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

  useEffect(() => {
    if (selectedDate !== null) {
      handleDateSelect();
    }
  }, [selectedDate]);

  useIonViewWillLeave(() => {
    console.log("test");
    localStorage.removeItem('selectedOption');
    console.log(localStorage.getItem('selectedOption'))
  });

  useEffect(() => {
    const loadUserLanguage = async () => {
      const success = await fetchUserLanguage(db); // Call the function and await its result
      setLoading(!success); // Set loading to true if fetching failed, false if successful
    };

    loadUserLanguage();
  }, [db]);

  if (loading) return <p>{t("Loading...")}</p>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/elderlyrequests"/>
          </IonButtons>
          <IonTitle>{whatToLearn} {t("Request")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ textAlign: 'center' }}>

        <h3 className='select-time'>{t("Choose a time when you are free.")}</h3>

        <Calendar handleCalendarClick={handleCalendarClick}/>

      </IonContent>

      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>{t("Specify problem")}</IonTitle>
            <IonButtons slot="end" onClick={closerequestpart2}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        {errorMessage && (
          <IonText color="primary" style={{ textAlign: 'center' }}>
            <b><p>{errorMessage}</p></b>
          </IonText>
        )}

        <IonContent style={{ textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <IonIcon icon={calendarOutline} style={{ fontSize: '50px'}}/>
            <p style={{ fontSize: '24px', paddingRight: '15px', paddingLeft: '15px', marginTop: '0px' }}>Selected timing: {formattedDate}</p>
          </div>

          {/* Recording Button */}
          <div className='recording-button' style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
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
              <p>{t("Recording in progress...")}</p>
            </div>
          )}

          {/* Play Audio Button */}
          {mainAudioBlob && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <IonButton onClick={handleAudioPlay} disabled={isPlaying} shape='round'>
                <IonIcon slot="start" icon={playOutline} />
                {isPlaying ? t("Playing...") : t("Play Recording")}
              </IonButton>
            </div>
          )}

          {/* Remarks Section */}
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <IonIcon icon={chatbubbleEllipsesOutline} style={{ fontSize: '50px' }}/>
            <IonTextarea
              className='remarks-space'
              placeholder={t("Type your remarks here...")}
              mode="md"
              fill="outline"
              label={t("Remarks")}
              labelPlacement="floating"
              value={remarks}
              onIonInput={e => setRemarks(e.detail.value!)}
              style={{ marginTop: '20px' }}
            />
            <IonButton className='submit-button' expand="block" color="primary" onClick={handleSubmit} style={{ marginTop: '10px' }} shape='round'>
              {t("Submit Request")}
            </IonButton>
          </div>

          <IonToast
            isOpen={showToast}
            message={t("Request submitted successfully!")}
            duration={2000}
            onDidDismiss={() => setShowToast(false)}
          />

          <IonLoading isOpen={uploading} message={t("Request uploading...")} />

        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default MakeRequest;
