import React from 'react';
import './ContentSeparator.css';

// Define the prop type
interface ContentSeparatorProps {
  text: string;
}

const ContentSeparator: React.FC<ContentSeparatorProps> = ({ text }) => {
  return (
    <div className="content-separator">
      <div className="line"></div>
      <span className="separator-text">{text}</span>
      <div className="line"></div>
    </div>
  );
};

export default ContentSeparator;
