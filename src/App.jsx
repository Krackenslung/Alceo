import { useState } from 'react';
import Home from './pages/Home.jsx';
import Workout from './pages/Workout.jsx';
import TabBar from './components/TabBar.jsx';

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
      {tab === 'home' ? (
        <Home
          today={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onModify={handleModify}
        />
      ) : (
        <Workout date={selectedDate} />
      )}
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
