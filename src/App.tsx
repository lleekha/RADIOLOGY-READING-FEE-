import React, { useState } from 'react';
import Auth from './components/Auth';
import ClaimSlipGenerator from './components/ClaimSlipGenerator';

export default function App() {
  const [user, setUser] = useState<{ username: string, modality: string } | null>(null);

  const handleLogin = (username: string, modality: string) => {
    setUser({ username, modality });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen">
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <ClaimSlipGenerator 
          onLogout={handleLogout} 
          username={user.username} 
          userModality={user.modality}
        />
      )}
    </div>
  );
}
