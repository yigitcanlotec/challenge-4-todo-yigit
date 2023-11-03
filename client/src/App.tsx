import LoginViews from './views/LoginViews';
import WelcomeViews from './views/WelcomeViews';
import RegisterViews from './views/RegisterViews';
import HomeViews from './views/HomeViews';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { createContext } from 'react';
import serverURL from './contexts/ServerURLContext';
import Profile from './views/ProfileViews';

function App() {
  return (
    <Router>
      <serverURL.Provider value='http://localhost:3000'>
        <Routes>
          <Route path='/' element={<WelcomeViews />} />
          <Route path='/login' element={<LoginViews />} />
          <Route path='/register' element={<RegisterViews />} />
          <Route path='/home' element={<HomeViews />} />
          <Route path='/profile' element={<Profile />} />
        </Routes>
      </serverURL.Provider>
    </Router>
  );
}

export default App;
