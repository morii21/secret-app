import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import NavBar from '../components/NavBar';


const SecretPage2 = () => {
    const [user, setUser] = useState(null);
    const [secretMessage, setSecretMessage] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

    const handleSaveMessage = async () => {
        if (!newMessage) {
            setErrorMessage("Message cannot be empty");
            return;
        }

        try {
            const response = await fetch('/api/secretMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id, message: newMessage }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save message");
            }

            setSuccessMessage("Secret message saved successfully!");
            setSecretMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            console.error("Error saving secret message:", error.message);
            setErrorMessage(error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <div className="">
            <NavBar />
            <div className="container ">
                <div className="header ">
                    <h1>Secret Page 2</h1>



                    {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                    {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                </div>
                {user ? (
                    <div className="header">
                        <p>Welcome, {user.email}</p>
                        <p>Your Secret Message: {secretMessage || 'No secret message yet.'}</p>

                        <textarea className="input header text"
                            placeholder="Enter your secret message"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />

                        <button className="on-Click" onClick={handleSaveMessage}>Save Message</button>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
};

export default SecretPage2;
