import { useState } from 'react';
import Home from './pages/Home.jsx';
import Workout from './pages/Workout.jsx';
import Sidebar from './components/Sidebar.jsx';

export default function App() {
  const [today] = useState(() => new Date());
  const [tab, setTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(today);

  // Modify sends the user to the workout page for the selected date.
  const handleModify = (date) => {
    setSelectedDate(date);
    setTab('workout');
  };

  return (
    <div className="app">
      <Sidebar active={tab} onChange={setTab} />
      {tab === 'workout' ? (
        <Workout date={selectedDate} />
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
