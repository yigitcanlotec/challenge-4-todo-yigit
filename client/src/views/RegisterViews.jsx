import { useState } from 'react';
import './registerViews.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const inputUsername = (event) => {
    setUsername(event.target.value);
  };
  const inputPassword = (event) => {
    setPassword(event.target.value);
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
              <input type='button' id='register-button' value='Register' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
