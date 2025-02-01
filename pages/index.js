import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import dynamic from 'next/dynamic';

const Index = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // This will run only on the client-side
        setIsClient(true);
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        const { user, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            window.location.href = '/secret-page-1'; // Redirect to secret page after login
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            alert('Registration successful! Please verify your email.');
        }
    };

    // Ensure we don't render anything on the server-side
    if (!isClient) {
        return null; // Return null until we know we're on the client-side
    }

    return (

        <div className="container ">
            <div className="header  ">
                <h1>Login or Register</h1>
                <div className="header ">
                    <input
                        className="input2"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        className="input2"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className="on-Click-container">
                    <div>
                        <button className="on-Click" onClick={handleLogin} disabled={loading}>
                            Login
                        </button>
                    </div>
                    <div>
                        <button className="on-Click" onClick={handleRegister} disabled={loading}>
                            Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Disable SSR for this page
export default dynamic(() => Promise.resolve(Index), { ssr: false });
