import Link from 'next/link';
import { supabase } from '../utils/supabaseClient';

const NavBar = () => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <nav style={{ display: 'flex', gap: '10px', padding: '10px', background: '#333', color: '#fff' }}>
            <ul>
                <li><Link href="/secret-page-1" >Secret Page 1 </Link></li>
                <li><Link href="/secret-page-2" >Secret Page 2 </Link></li>
                <li><Link href="/secret-page-3" >Secret Page 3 </Link></li>

            </ul>
            <button onClick={handleLogout} style={{ marginLeft: 'auto', background: 'red', color: 'white', padding: '5px' }}>Logout</button>
        </nav>
    );
};

export default NavBar;