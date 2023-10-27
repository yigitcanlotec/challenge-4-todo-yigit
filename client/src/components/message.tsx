import React from 'react';
import './message.css';

export default function Message({ errorMessage }) {
  return (
    <div className='message-container'>
      <p>{errorMessage}</p>
    </div>
  );
}
