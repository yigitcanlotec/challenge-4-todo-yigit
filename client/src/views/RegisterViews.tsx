import React, { useState } from 'react';
import './registerViews.css';
import axios from 'axios';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const inputUsername = (event) => {
    setUsername(event.target.value);
  };
  const inputPassword = (event) => {
    setPassword(event.target.value);
  };

  const sendRegisterRequest = () => {
    const base64Credentials = btoa(username + ':' + password);

    axios
      .post('http://localhost:3000/api/v1/register', {
        username: username,
        password: password,
      })
      .then((response) => {
        // console.log(response);
        // console.log('user created');
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  return (
    <div className='register-container'>
      <div className='register-container-left'>
        <div className='container-1'>
          <div className='container-1-left'>left</div>
        </div>
      </div>
      <div className='register-container-right'>
        <div className='container-2'>
          <div className='elements-container'>
            <h3>Register</h3>
            <label htmlFor='text-input'>Kullanıcı Adı</label>
            <input
              type='text'
              id='text-input'
              value={username}
              onChange={inputUsername}
            />
            <label htmlFor='password-input'>Password</label>
            <input
              type='password'
              id='password-input'
              value={password}
              onChange={inputPassword}
            />
            <div className='button-container'>
              <input
                type='button'
                id='register-button'
                value='Register'
                onClick={sendRegisterRequest}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
