import LoginViews from './views/LoginViews';
import WelcomeViews from './views/WelcomeViews';
import RegisterViews from './views/RegisterViews';
import HomeViews from './views/HomeViews';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<WelcomeViews />} />
        <Route path='/login' element={<LoginViews />} />
        <Route path='/register' element={<RegisterViews />} />
        <Route path='/home' element={<HomeViews />} />
      </Routes>
    </Router>
  );
}

export default App;
