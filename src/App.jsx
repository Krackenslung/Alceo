import { useCallback, useEffect, useMemo, useState } from 'react';
import Home from './pages/Home.jsx';
import Workout from './pages/Workout.jsx';
import Progress from './pages/Progress.jsx';
import Filters from './pages/Filters.jsx';
import Profile from './pages/Profile.jsx';
import Session from './pages/Session.jsx';
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import { AppContext } from './AppContext.jsx';
import { api, del, getToken, post, setToken, setUnauthorizedHandler } from './api/client.js';
import { filtersToRows, rowsToFilters, syncFilters } from './api/filters.js';
import { toDate } from './lib/workouts.js';
import { usePersistentState } from './store.js';

const DEFAULT_PREFS = { units: 'kg', weekStart: 'mon' };
const OPEN = ['planned', 'in_progress'];
const HISTORY_DETAILS = 100;

const byFinishedDesc = (a, b) => toDate(b.finished_at) - toDate(a.finished_at);
const byCreatedDesc = (a, b) => toDate(b.created_at) - toDate(a.created_at) || b.id - a.id;

function Splash({ children }) {
  return (
    <div className="signedout">
      <div className="panel signedout__card">
        <span className="logo__mark">A</span>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [today] = useState(() => new Date());
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(getToken()));
  const [tab, setTab] = useState('home');
  const [prefs, setPrefs] = usePersistentState('alceo:prefs', DEFAULT_PREFS);
  const [photo, setPhoto] = usePersistentState('alceo:photo', null);
  const [filterRows, setFilterRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg) => setToast({ msg, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), toast.msg.length > 60 ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setWorkouts([]);
    setFilterRows([]);
    setCatalog([]);
    setLoaded(false);
    setSelectedId(null);
    setTab('home');
  }, []);
  useEffect(() => setUnauthorizedHandler(signOut), [signOut]);

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const loadFilters = useCallback(async () => setFilterRows(await api('/filters')), []);

  const loadWorkouts = useCallback(async () => {
    const list = await api('/workouts?limit=200');
    const wanted = [
      ...list.filter((w) => OPEN.includes(w.status)),
      ...list.filter((w) => w.status === 'completed').slice(0, HISTORY_DETAILS),
    ];
    setWorkouts(await Promise.all(wanted.map((w) => api(`/workouts/${w.id}`))));
  }, []);

  useEffect(() => {
    if (user?.status !== 'active') return undefined;
    let cancelled = false;
    setLoaded(false);
    Promise.all([loadFilters(), api('/exercises').then(setCatalog), loadWorkouts()])
      .catch((e) => notify(e.message))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.status, loadFilters, loadWorkouts, notify]);

  const upsertWorkout = useCallback((w) => {
    setWorkouts((ws) => {
      const rest = ws.filter((x) => x.id !== w.id);
      return w.status === 'abandoned' ? rest : [w, ...rest];
    });
  }, []);
  const removeWorkout = useCallback((id) => setWorkouts((ws) => ws.filter((w) => w.id !== id)), []);
  const refreshWorkout = useCallback(async (id) => {
    try {
      upsertWorkout(await api(`/workouts/${id}`));
    } catch (e) {
      if (e.status === 404) removeWorkout(id);
      else notify(e.message);
    }
  }, [upsertWorkout, removeWorkout, notify]);

  const history = useMemo(() => workouts.filter((w) => w.status === 'completed').sort(byFinishedDesc), [workouts]);
  const open = useMemo(
    () => workouts.filter((w) => OPEN.includes(w.status))
      .sort((a, b) => (b.status === 'in_progress') - (a.status === 'in_progress') || byCreatedDesc(a, b)),
    [workouts],
  );
  const inProgress = open.find((w) => w.status === 'in_progress') ?? null;
  const nextWorkout = open[0] ?? null;
  const selected = open.find((w) => w.id === selectedId) ?? nextWorkout;
  const filters = useMemo(() => rowsToFilters(filterRows), [filterRows]);
  const catalogById = useMemo(() => Object.fromEntries(catalog.map((e) => [e.id, e])), [catalog]);

  const generate = async ({ request = '', navigate = false } = {}) => {
    if (generating) return;
    setGenerating(true);
    notify('Generating your workout with AI… about 15 seconds');
    try {
      const w = await post('/ai/workouts', { request });
      upsertWorkout(w);
      setSelectedId(w.id);
      notify(`Ready: ${w.name ?? 'new workout'}`);
      if (navigate) setTab('workout');
    } catch (e) {
      notify(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const startWorkout = async (w) => {
    try {
      const current = w.status === 'planned' ? await post(`/workouts/${w.id}/start`) : w;
      upsertWorkout(current);
      setSelectedId(current.id);
      setTab('session');
    } catch (e) {
      notify(e.message);
    }
  };

  const saveFilters = async (next) => {
    const all = await api('/filters?include_inactive=1');
    await syncFilters(all, filtersToRows(next));
    await loadFilters();
  };

  const deleteAccount = async () => {
    try {
      await del('/users/me');
      setPhoto(null);
      signOut();
    } catch (e) {
      notify(e.message);
    }
  };

  if (booting) return <Splash><p className="muted">Loading…</p></Splash>;

  if (!user) {
    return <Auth onAuthed={({ token, user: u }) => { setToken(token); setUser(u); }} />;
  }

  if (user.status === 'onboarding') {
    return <Onboarding user={user} units={prefs.units} onDone={setUser} onSignOut={signOut} />;
  }

  if (user.status === 'blocked') {
    return (
      <Splash>
        <h1>Account blocked</h1>
        <p className="muted">This account can’t use Alceo. If your date of birth is wrong, contact support.</p>
        <button className="btn btn--lime" onClick={signOut}>Sign out</button>
      </Splash>
    );
  }

  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

  const ctx = {
    today, user, setUser, prefs, setPrefs, units: prefs.units, weekStart: prefs.weekStart,
    photo, setPhoto, initials,
    filters, saveFilters, catalog, catalogById,
    workouts, history, open, inProgress, nextWorkout, selected, selectWorkout: setSelectedId,
    upsertWorkout, removeWorkout, refreshWorkout,
    generate, generating, startWorkout,
    go: setTab, toast: notify, signOut, deleteAccount,
  };

  const sessionWorkout = tab === 'session' ? (open.find((w) => w.id === selectedId && w.status === 'in_progress') ?? inProgress) : null;

  let page;
  if (!loaded) {
    page = <main className="main"><section className="panel"><p className="panel__sub">Loading your data…</p></section></main>;
  } else if (tab === 'session' && sessionWorkout) {
    page = <Session key={sessionWorkout.id} workout={sessionWorkout} />;
  } else if (tab === 'profile') {
    page = <Profile />;
  } else if (tab === 'filters') {
    page = <Filters />;
  } else if (tab === 'progress') {
    page = <Progress />;
  } else if (tab === 'workout' || tab === 'session') {
    page = <Workout />;
  } else {
    page = <Home />;
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="app">
        <Sidebar active={tab === 'session' ? 'workout' : tab} onChange={setTab} />
        {page}
      </div>
      <Toast message={toast?.msg} />
    </AppContext.Provider>
  );
}
