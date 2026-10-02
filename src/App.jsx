import { useState } from 'react';
import Home from './pages/Home.jsx';
import Workout from './pages/Workout.jsx';
import Progress from './pages/Progress.jsx';
import Filters from './pages/Filters.jsx';
import { DEFAULT_FILTERS } from './data/filters.js';
import Sidebar from './components/Sidebar.jsx';

export default function App() {
  const [today] = useState(() => new Date());
  const [tab, setTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(today);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Modify sends the user to the workout page for the selected date.
  const handleModify = (date) => {
    setSelectedDate(date);
    setTab('workout');
  };

  return (
    <div className="app">
      <Sidebar active={tab} onChange={setTab} />
      {tab === 'filters' ? (
        <Filters filters={filters} setFilters={setFilters} />
      ) : tab === 'progress' ? (
        <Progress />
      ) : tab === 'workout' ? (
        <Workout today={today} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      ) : (
        <Home
          today={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onModify={handleModify}
        />
      )}
    </div>
  );
}
