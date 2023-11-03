import React from 'react';
import { useState } from 'react';
import './profileViews.css';

export default function Profile() {
  const username = localStorage.getItem('user');
  const [password, setPassword] = useState('');

  const inputPassword = (event) => {
    setPassword(event.target.value);
  };

  return (
    <div className='container'>
      <div className='profile-container'>
        <label htmlFor='password-input'>Password</label>
        <input type='password' id='password-input' onChange={inputPassword} />
      </div>
    </div>
  );
}
