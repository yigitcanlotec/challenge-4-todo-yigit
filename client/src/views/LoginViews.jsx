import { useState } from 'react';
import './loginViews.css';
import axios from 'axios';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

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
      .get('http://localhost:3000/api/v1/login', {
        headers: {
          Authorization: `Basic ${base64Credentials}`,
        },
      })
      .then((response) => {
        setToken(response.data);
        console.log('Token:', response.data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

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
              value={password}
              onChange={inputPassword}
            />
            <div className='button-container'>
              <input
                type='button'
                id='login-button'
                value='Log In'
                onClick={sendLoginRequest}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
