import LoginPage from './views/LoginPage';
import WelcomePage from './views/WelcomePage.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<WelcomePage />} />
        <Route path='/login' element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
