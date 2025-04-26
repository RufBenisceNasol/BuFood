import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SplashScreen.css';
import logod from '../assets/logod.png';
import delibup from '../assets/delibup.png';
import splash1 from '../assets/splash1.png';
import splash2 from '../assets/splash2.png';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showDelibup, setShowDelibup] = useState(false);
  const [showFinalContent, setShowFinalContent] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [logoPosition, setLogoPosition] = useState('bottom');

  useEffect(() => {
    // First stage: logo stays at bottom for 2s
    setTimeout(() => {
      setLogoPosition('center');
    }, 2000);

    // Second stage: hide logo after staying in center for 2s
    setTimeout(() => {
      setShowLogo(false);
    }, 4000);

    // Third stage: show delibup logo
    setTimeout(() => {
      setShowDelibup(true);
    }, 4300);

    // Fourth stage: hide delibup logo and show final content
    setTimeout(() => {
      setShowDelibup(false);
      setShowFinalContent(true);
    }, 6300);

    return () => {
      // Cleanup timers if component unmounts
    };
  }, []);

  // Handle slide show
  useEffect(() => {
    if (showFinalContent) {
      const slideInterval = setInterval(() => {
        setCurrentSlide(prev => prev === 0 ? 1 : 0);
      }, 3000); // Switch slides every 3 seconds

      return () => clearInterval(slideInterval);
    }
  }, [showFinalContent]);

  const handleGetStarted = () => {
    setIsVisible(false);
    navigate('/login');
  };

  if (!isVisible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-content">
        {showLogo && (
          <img 
            src={logod} 
            alt="Logo" 
            className={`logo-animation ${logoPosition}`}
          />
        )}
        {showDelibup && (
          <img 
            src={delibup} 
            alt="Delibup" 
            className="delibup-animation"
          />
        )}
        {showFinalContent && (
          <div className="final-content">
            <div className="splash-slides">
              <div className={`slide ${currentSlide === 0 ? 'active' : ''}`}>
                <img src={splash1} alt="Delicious Food" />
                <h2>Delicious Food</h2>
                <p>we help you find best and delicious food</p>
              </div>
              <div className={`slide ${currentSlide === 1 ? 'active' : ''}`}>
                <img src={splash2} alt="Fast Delivery" />
                <h2>Fast Delivery</h2>
                <p>we ensure safe and fast delivery</p>
              </div>
              <div className="slide-dots">
                <span className={currentSlide === 0 ? 'active' : ''}></span>
                <span className={currentSlide === 1 ? 'active' : ''}></span>
              </div>
            </div>
            <button onClick={handleGetStarted} className="get-started-btn">
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;