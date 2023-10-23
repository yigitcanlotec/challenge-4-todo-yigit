import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [isVisible, setIsVisible] = useState(true);

  setTimeout(() => {
    document.querySelector("#root > div > h1").classList.add("lift-effect");
    setIsVisible(false);
  }, 2000);

 

 

  return (
    <div className='main-container'>
      <h1>TodoApp</h1>
      <button className={isVisible ? 'hidden' : 'visible'}>Log In</button>
    </div>
  )
}

export default App
