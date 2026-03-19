import React, { useState } from 'react';
import Auth from './components/Auth';
import ClaimSlipGenerator from './components/ClaimSlipGenerator';

export default function App() {
  const [user, setUser] = useState<string | null>(null);

  const handleLogin = (username: string) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <ClaimSlipGenerator onLogout={handleLogout} username={user} />
      )}
    </div>
  );
}
