import React, { useContext, useEffect, useRef } from 'react';
import { useState } from 'react';
import './profileViews.css';
import ServerURLContext from '../contexts/ServerURLContext';
import axios from 'axios';
import Message from '../components/Message';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const username = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const serverURL = useContext(ServerURLContext);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messageBox, setMessageBox] = useState('');
  const navigate = useNavigate();

  const inputPassword = (event) => {
    setPassword(event.target.value);
  };

  const inputOldPassword = (event) => {
    setOldPassword(event.target.value);
  };

  const inputConfirmPassword = (event) => {
    setConfirmPassword(event.target.value);
  };

  const changePassword = async (
    event,
    username,
    token,
    oldPassword,
    newPassword,
    messageBox,
    errorTimeoutRef
  ) => {
    const result = await axios.post(
      serverURL + `/api/v1/${username}/change-password`,
      {
        oldPassword: oldPassword,
        newPassword: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    messageBox(result.data);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setMessageBox('');
    }, 2000);
  };

  const msgBox = (message: string) => {
    setMessageBox(message);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setMessageBox('');
    }, 2000);
  };

  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <>
      <div className='back'>
        <span className='material-symbols-outlined' onClick={goBack}>
          arrow_back
        </span>
      </div>
      <div className='container'>
        <div className='profile-container'>
          <div className=''>
            <label htmlFor='password-input'>Old Password</label>
            <br />
            <input
              type='password'
              id='password-input'
              onChange={inputOldPassword}
            />
          </div>
          <div className=''>
            <label htmlFor='password-input'>New Password</label>
            <br />
            <input
              type='password'
              id='password-input'
              onChange={inputPassword}
            />
          </div>
          <div className=''>
            <label htmlFor='password-input'>Confirm New Password</label>
            <br />
            <input
              type='password'
              id='password-input'
              onChange={inputConfirmPassword}
            />
          </div>
          <button
            onClick={(e) =>
              password === confirmPassword
                ? changePassword(
                    e,
                    username,
                    token,
                    oldPassword,
                    password,
                    setMessageBox,
                    errorTimeoutRef
                  )
                : msgBox('Password Does Not Match')
            }
          >
            Şifreyi Değiştir
          </button>
          {messageBox && <Message errorMessage={messageBox} />}
        </div>
      </div>
    </>
  );
}
