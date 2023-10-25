import LoginViews from './views/LoginViews';
import WelcomeViews from './views/WelcomeViews';
import RegisterViews from './views/RegisterViews';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<WelcomeViews />} />
        <Route path='/login' element={<LoginViews />} />
        <Route path='/register' element={<RegisterViews />} />
      </Routes>
    </Router>
  );
}

export default App;
