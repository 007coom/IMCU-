
import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/sound';

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypingText: React.FC<TypingTextProps> = ({ text, speed = 30, className, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      soundManager.playKeystroke(); // Play sound for computer typing output
      index++;
      
      if (index === text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  return <span className={className}>{displayedText}</span>;
};
