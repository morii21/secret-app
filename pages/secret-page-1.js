import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import NavBar from '../components/NavBar';

const SecretPage1 = () => {
  const [user, setUser] = useState(null);
  const [secretMessage, setSecretMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchSecretMessage(session.user.id);
      } else {
        window.location.href = '/';
      }

      if (error) {
        setErrorMessage('Error fetching session: ' + error.message);
      }
    };

    getSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  const fetchSecretMessage = async (userId) => {
    const { data, error } = await supabase
      .from('secret_messages')
      .select('message')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error fetching secret message:", error.message);
    } else {
      setSecretMessage(data?.message || '');
    }
  };

  const handleDeleteAccount = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error("Error deleting account:", error.message);
      // Optional: show error to user
      alert(error.message);
    }
  };

  return (
    <div>
      <NavBar />
      <h1>Secret Page 1</h1>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <p>Your Secret Message: {secretMessage || 'No secret message yet.'}</p>
          <button onClick={() => handleDeleteAccount(user.id)}>Delete Account</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default SecretPage1;
