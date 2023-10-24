import WelcomePage from './views/WelcomePage.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<WelcomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
