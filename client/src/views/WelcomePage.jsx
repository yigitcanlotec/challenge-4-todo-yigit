import { useState } from 'react';
import './welcomepage.css';
import { useNavigate } from 'react-router-dom';

function WelcomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const navigateToLogin = () => {
    navigate('/login');
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

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
          onClick={navigateToLogin}
        >
          Log In
        </button>
        <button
          className={`register-button ${isVisible ? 'visible' : ''}`}
          onClick={navigateToRegister}
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
