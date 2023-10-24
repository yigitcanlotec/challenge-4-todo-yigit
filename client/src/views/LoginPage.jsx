import { useState } from 'react';
import './loginpage.css';

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
    <div className='login-container'>
      <div className='login-container-left'>
        <div className='container-1'>left</div>
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
              <input type='button' id='login-button' value='Log In' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
