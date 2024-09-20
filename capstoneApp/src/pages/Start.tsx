import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonButton } from '@ionic/react';
import './Start.css';

const Start: React.FC = () => {
  const images = [
    './StartImage1.jpeg',
    './StartImage2.jpeg',
    './StartImage3.jpeg'
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to change image and trigger fade in/out animation
  const changeImage = (newIndex: number) => {
    setFadeClass('fade-out'); // Start fade-out animation
    setTimeout(() => {
      setCurrentImageIndex(newIndex);
      setFadeClass('fade-in'); // Fade-in new image
    }, 300); // 300ms fade duration
  };

  const startInterval = () => {
    intervalRef.current = setInterval(() => {
      changeImage((prevIndex) => (prevIndex + 1) % images.length);
    }, 3500); // Change image every 3.5 seconds
  };

  const resetCooldown = (index: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current); // Clear existing interval
    }
    changeImage(index); // Change image immediately
    startInterval(); // Restart the interval
  };

  useEffect(() => {
    startInterval(); // Start interval on component mount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Clean up interval on component unmount
      }
    };
  }, [images.length]);

  return (
    <IonPage>
      <IonContent>
        <div className="container">
          <img
            src={images[currentImageIndex]}
            alt="Start Page"
            className={`top-image ${fadeClass}`} // Add fade animation class
          />
          <div className="dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => resetCooldown(index)} // Reset cooldown on dot click
              ></span>
            ))}
          </div>
          <div className="bottom-text">
            <h1>Welcome to the HWN app</h1>
            <p>The HWN x SST app made by students for elderly to voice their concerns to HWN for help.</p>
            <p>If it isn't from the heart, it is not worth doing.</p>
          </div>
        </div>

        <IonButton expand="block" color="danger" routerLink="/login" className="getStartedButton">
          Get started
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Start;
