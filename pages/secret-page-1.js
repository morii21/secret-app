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
      setErrorMessage(''); // Clear any previous errors

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

      // If successful, sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error("Error deleting account:", error);
      setErrorMessage(error.message);
    }
  };
  return (

    <div className="">
      <NavBar />
      <div className="container ">
        <div className="header ">
          <h1>Secret Page 1</h1>
        </div>



        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        {
          user ? (
            <div className="header">
              <p>Welcome, {user.email}</p>
              <p>Your Secret Message: {secretMessage || 'No secret message yet.'}</p>
              <div className="on-Click-container">
                <button className="on-Click" onClick={() => handleDeleteAccount(user.id)}>Delete Account</button>
                <button className="on-Click" onClick={() => handleLogout(user.id)}>Log out</button>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )
        }
      </div >
    </div >
  );
};

export default SecretPage1;