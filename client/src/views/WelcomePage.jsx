import { useState } from 'react';
import './welcomepage.css';

function WelcomePage() {
  const [isVisible, setIsVisible] = useState(false);

  setTimeout(() => {
    document.querySelector('#todo-header').classList.add('lift-effect');
    setIsVisible(true);
  }, 2000);

  return (
    <div className='main-container'>
      <h1 id='todo-header'>TodoApp</h1>
      <div>
        <button
          className={`login-button ${isVisible ? 'visible' : ''}`}
          onClick={''}
        >
          Log In
        </button>
        <button
          className={`register-button ${isVisible ? 'visible' : ''}`}
          onClick={''}
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
