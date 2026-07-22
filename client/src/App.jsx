import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store';
import { connectSocket, disconnectSocket } from './socket';
import { apiGet } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

function App() {
  const token = useStore((s) => s.token);
  const setUser = useStore((s) => s.setUser);
  const setServers = useStore((s) => s.setServers);
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (token && !user) {
      apiGet('/api/me')
        .then((data) => {
          if (data.id) {
            setUser(data);
            const socket = connectSocket();
          } else {
            useStore.getState().logout();
          }
        })
        .catch(() => {});

      apiGet('/api/servers')
        .then((data) => {
          if (Array.isArray(data)) setServers(data);
        })
        .catch(() => {});
    }

    return () => {
      disconnectSocket();
    };
  }, [token]);

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={token ? <Home /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
