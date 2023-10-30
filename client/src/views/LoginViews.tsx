import React, { useState, useEffect, useRef, useContext } from 'react';
import './loginViews.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Message from '../components/message';
import ServerURLContext from '../contexts/ServerURLContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [messageBox, setMessageBox] = useState('');
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const serverURL = useContext(ServerURLContext);

  const inputUsername = (event) => {
    setUsername(event.target.value);
  };
  const inputPassword = (event) => {
    setPassword(event.target.value);
  };

  const sendLoginRequest = () => {
    // Base64 encode the username and password
    const base64Credentials = btoa(username + ':' + password);

    axios
      .get(serverURL + '/api/v1/login', {
        headers: {
          Authorization: `Basic ${base64Credentials}`,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setToken(response.data);
          localStorage.setItem('token', response.data);
          localStorage.setItem('user', username);
          setMessageBox('Başarılı!');
          setTimeout(() => {
            setMessageBox('');
            navigate('/home');
          }, 2000);
        } else {
          {
            setMessageBox(response.data);
            errorTimeoutRef.current = setTimeout(() => {
              setMessageBox('');
            }, 2000);
          }
        }
      })
      .catch((err) => {
        console.log(err.message);
        setMessageBox(err.message);
        if (err.message.includes('500')) {
          setMessageBox('Server hatası!');
          console.log(messageBox);
        } else {
          setMessageBox('Kullanıcı adı veya şifre yanlış!');
          console.log(messageBox);
        }

        errorTimeoutRef.current = setTimeout(() => {
          setMessageBox('');
        }, 2000);
      });
  };

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      console.log('Key pressed:', event.key);
      sendLoginRequest();
    }
  }

  return (
    <div className='login-container'>
      <div className='login-container-left'>
        <div className='container-1'>
          <div className='container-1-left'>left</div>
        </div>
      </div>
      <div className='login-container-right'>
        <div className='container-2'>
          <div className='elements-container'>
            <h3>Log In</h3>
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
              onChange={inputPassword}
            />
            <div className='button-container'>
              <input
                type='button'
                id='login-button'
                value='Log In'
                onKeyDown={(e) => (e.key === 'Enter' ? handleKeyDown : '')}
                onClick={sendLoginRequest}
              />
            </div>
            {messageBox && <Message errorMessage={messageBox} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
