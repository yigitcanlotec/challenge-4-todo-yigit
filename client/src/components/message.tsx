import React from 'react';
import './message.css';

function Message({ errorMessage }) {
  return (
    <div className='message-container'>
      <p>{errorMessage}</p>
    </div>
  );
}

export default Message;
