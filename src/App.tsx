import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Goals } from './pages/Goals';
import { Tasks } from './pages/Tasks';
import { Progress } from './pages/Progress';
import { Meetings } from './pages/Meetings';
import { Risks } from './pages/Risks';
import { Stats } from './pages/Stats';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/risks" element={<Risks />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Router>
  );
}
