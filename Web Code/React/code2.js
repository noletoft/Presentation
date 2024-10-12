import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StreamFacts.module.css'

const StreamFacts = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/ticker-tape.js';
    script.innerHTML = JSON.stringify({
      symbols: [
        { title: 'S&P 500 Index', proName: 'FOREXCOM:SPXUSD' },
        { description: 'Bitcoin Dominancy', proName: 'CRYPTOCAP:BTC.D' },
        { description: 'Crypto Market Cap', proName: 'CRYPTOCAP:TOTAL' },
        { description: 'Dollar Index', proName: 'CAPITALCOM:DXY' }
      ],
      showSymbolLogo: true,
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'regular',
      locale: 'en'
    });

    const currentContainer = containerRef.current;

    if (currentContainer) {
      currentContainer.appendChild(script);
    }

    return () => {
      if (currentContainer && currentContainer.contains(script)) {
        currentContainer.removeChild(script);
      }
    };
  }, []);

  const goToViewFacts = () => {      
    navigate('/TRViewFacts');
  };

  return (
    <div onClick={goToViewFacts}>
      <div className={styles.stream_container}>
        <div className="tradingview-widget-container">
          <div
            className="tradingview-widget-container__widget"
            id="tradingview-widget-script-container"
            ref={containerRef}
          ></div>
          <div className="tradingview-widget-copyright">        
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamFacts;