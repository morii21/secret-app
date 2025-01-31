import Link from 'next/link';
import { supabase } from '../utils/supabaseClient';

const NavBar = () => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <nav style={{ display: 'flex', gap: '10px', padding: '10px', background: '#333', color: '#fff' }}>
            <Link href="/secret-page-1" style={{ color: 'white', textDecoration: 'none' }}>Secret Page 1 |</Link>
            <Link href="/secret-page-2" style={{ color: 'white', textDecoration: 'none' }}>Secret Page 2 |</Link>
            <Link href="/secret-page-3" style={{ color: 'white', textDecoration: 'none' }}>Secret Page 3 |</Link>
            <button onClick={handleLogout} style={{ marginLeft: 'auto', background: 'red', color: 'white', padding: '5px' }}>Logout</button>
        </nav>
    );
};

export default NavBar;
