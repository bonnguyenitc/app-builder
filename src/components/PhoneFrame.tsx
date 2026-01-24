import React from 'react';

type DeviceType = 'iphone16' | 'pixel8';

interface PhoneFrameProps {
  imageSrc: string;
  type: DeviceType;
  className?: string;
  style?: React.CSSProperties;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  imageSrc,
  type,
  className = '',
  style,
}) => {
  const isIphone = type === 'iphone16';

  // Frame dimensions and styling based on device type
  const frameStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: isIphone ? '#1c1c1e' : '#202124',
    borderRadius: isIphone ? '54px' : '40px',
    padding: isIphone ? '14px' : '10px',
    boxShadow: `
      0 0 0 1px ${isIphone ? '#3a3a3c' : '#3c4043'},
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.05)
    `,
    ...style,
  };

  const screenStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: isIphone ? '42px' : '32px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  };

  return (
    <div className={`phone-frame ${className}`} style={frameStyles}>
      {/* Side buttons for iPhone */}
      {isIphone && (
        <>
          {/* Volume buttons */}
          <div
            style={{
              position: 'absolute',
              left: '-3px',
              top: '120px',
              width: '3px',
              height: '32px',
              backgroundColor: '#3a3a3c',
              borderRadius: '2px 0 0 2px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '-3px',
              top: '165px',
              width: '3px',
              height: '60px',
              backgroundColor: '#3a3a3c',
              borderRadius: '2px 0 0 2px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '-3px',
              top: '235px',
              width: '3px',
              height: '60px',
              backgroundColor: '#3a3a3c',
              borderRadius: '2px 0 0 2px',
            }}
          />
          {/* Power button */}
          <div
            style={{
              position: 'absolute',
              right: '-3px',
              top: '180px',
              width: '3px',
              height: '80px',
              backgroundColor: '#3a3a3c',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </>
      )}

      {/* Side buttons for Pixel */}
      {!isIphone && (
        <>
          <div
            style={{
              position: 'absolute',
              right: '-3px',
              top: '140px',
              width: '3px',
              height: '45px',
              backgroundColor: '#3c4043',
              borderRadius: '0 2px 2px 0',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-3px',
              top: '200px',
              width: '3px',
              height: '70px',
              backgroundColor: '#3c4043',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </>
      )}

      {/* Screen */}
      <div style={screenStyles}>
        {/* Dynamic Island for iPhone 16 */}
        {isIphone && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '126px',
              height: '37px',
              backgroundColor: '#000',
              borderRadius: '20px',
              zIndex: 10,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.8)',
            }}
          />
        )}

        {/* Camera punch hole for Pixel */}
        {!isIphone && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '12px',
              height: '12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '50%',
              zIndex: 10,
              border: '2px solid #2a2a2a',
            }}
          />
        )}

        {/* Screenshot image */}
        <img
          src={imageSrc}
          alt="App Screenshot"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Home indicator for iPhone */}
        {isIphone && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '134px',
              height: '5px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
};
