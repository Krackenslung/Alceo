import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Workout from './pages/Workout.jsx';
import Progress from './pages/Progress.jsx';
import Filters from './pages/Filters.jsx';
import Profile from './pages/Profile.jsx';
import Session from './pages/Session.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import { AppContext } from './AppContext.jsx';
import { DEFAULT_FILTERS } from './data/filters.js';
import { DEFAULT_PROFILE } from './data/profile.js';
import { SEED_HISTORY, getWorkoutForDate } from './data/workouts.js';
import { generatePlan } from './data/generator.js';
import { clearPersisted, usePersistentState } from './store.js';
import { addDays, formatCompact, formatRange, getWeek, ymd } from './utils/dates.js';

export default function App() {
  const [today] = useState(() => new Date());
  const [tab, setTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(today);
  const [filters, setFilters] = usePersistentState('alceo:filters', DEFAULT_FILTERS);
  const [profile, setProfile] = usePersistentState('alceo:profile', DEFAULT_PROFILE);
  const [plans, setPlans] = usePersistentState('alceo:plans', {});
  const [history, setHistory] = usePersistentState('alceo:history', SEED_HISTORY);
  const [photo, setPhoto] = usePersistentState('alceo:photo', null);
  const [signedOut, setSignedOut] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const weekStart = profile.prefs.weekStart;
  const { first, last } = profile.info;
  const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';

  // A date's plan: a user/AI override if present (null = rest), otherwise the default schedule.
  const resolve = (date) => {
    const key = ymd(date);
    return key in plans ? plans[key] : getWorkoutForDate(date);
  };

  const updateWorkout = (date, fn) => {
    const current = resolve(date);
    if (!current) return;
    setPlans((p) => ({ ...p, [ymd(date)]: fn(JSON.parse(JSON.stringify(current))) }));
  };

  const generateWeek = (date, { navigate = false } = {}) => {
    const week = getWeek(date, weekStart);
    const plan = generatePlan(week, filters);
    setPlans((p) => ({ ...p, ...plan }));
    setToastMsg(`Plan generated for ${formatRange(week)}`);
    if (navigate) {
      const firstTraining = week.find((d) => plan[ymd(d)]) ?? week[0];
      setSelectedDate(firstTraining);
      setTab('workout');
    }
  };

  const generateNextWeek = () => generateWeek(addDays(today, 7), { navigate: true });

  const startSession = () => {
    if (resolve(selectedDate)) setTab('session');
    else setToastMsg('Nothing to start — that is a rest day');
  };

  const finishSession = ({ minutes, volume, doneSets, totalSets }) => {
    const workout = resolve(selectedDate);
    setHistory((h) => [
      {
        id: String(Date.now()),
        name: workout.name,
        date: formatCompact(selectedDate),
        dateKey: ymd(selectedDate),
        duration: `${minutes} min`,
        volume: volume ? `${Math.round(volume).toLocaleString()} kg` : '—',
        effort: `${workout.intensity}/10`,
      },
      ...h,
    ]);
    setToastMsg(`Session saved · ${doneSets}/${totalSets} sets`);
    setTab('home');
  };

  const deleteAccount = () => {
    clearPersisted();
    setFilters(DEFAULT_FILTERS);
    setProfile(DEFAULT_PROFILE);
    setPlans({});
    setHistory(SEED_HISTORY);
    setPhoto(null);
    setSignedOut(true);
    setTab('home');
  };

  const ctx = {
    today, weekStart, photo, setPhoto, initials, filters, profile, plans, history,
    resolve, updateWorkout, generateWeek, generateNextWeek, startSession,
    go: setTab,
    toast: setToastMsg,
    signOut: () => { setSignedOut(true); setTab('home'); },
    deleteAccount,
  };

  if (signedOut) {
    return (
      <div className="signedout">
        <div className="panel signedout__card">
          <span className="logo__mark">A</span>
          <h1>You’re signed out</h1>
          <p className="muted">See you at the next session.</p>
          <button className="btn btn--lime" onClick={() => setSignedOut(false)}>Sign back in</button>
        </div>
      </div>
    );
  }

  const sessionWorkout = tab === 'session' ? resolve(selectedDate) : null;

  let page;
  if (tab === 'session' && sessionWorkout) {
    page = (
      <Session
        key={ymd(selectedDate)}
        workout={sessionWorkout}
        date={selectedDate}
        onFinish={finishSession}
        onCancel={() => setTab('workout')}
      />
    );
  } else if (tab === 'profile') {
    page = <Profile profile={profile} setProfile={setProfile} filters={filters} />;
  } else if (tab === 'filters') {
    page = <Filters filters={filters} setFilters={setFilters} />;
  } else if (tab === 'progress') {
    page = <Progress />;
  } else if (tab === 'workout') {
    page = <Workout today={today} selectedDate={selectedDate} onSelectDate={setSelectedDate} />;
  } else {
    page = (
      <Home
        today={today}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onModify={(date) => { setSelectedDate(date); setTab('workout'); }}
      />
    );
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="app">
        <Sidebar active={tab === 'session' ? 'workout' : tab} onChange={setTab} />
        {page}
      </div>
      <Toast message={toastMsg} />
    </AppContext.Provider>
  );
}
