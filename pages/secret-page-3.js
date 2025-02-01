import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import NavBar from '../components/NavBar';
import { useRouter } from 'next/router';
import '../components/sp-1.css';

const SecretPage3 = () => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [secretMessage, setSecretMessage] = useState('');
    const [friendRequests, setFriendRequests] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [flashMessage, setFlashMessage] = useState(''); // State for flash message
    const router = useRouter();

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session) {
                    console.log('Current user:', session.user);
                    setUser(session.user);
                } else {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Session error:', error);
                setErrorMessage('Error fetching session: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        getSession();
    }, []);

    useEffect(() => {
        if (user) {
            console.log('User state updated, fetching data...');
            fetchUsers();
            fetchFriendRequests();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, email')
                .neq('id', user.id);

            if (usersError) throw usersError;

            console.log('Users fetched:', usersData);

            if (!usersData) {
                setUsers([]);
                return;
            }

            const { data: requests, error: requestsError } = await supabase
                .from('friend_requests')
                .select('to_user_id, from_user_id, status')
                .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

            if (requestsError) throw requestsError;

            console.log('Friend requests:', requests);

            const mappedUsers = usersData.map(dbUser => {
                const request = requests?.find(r =>
                    (r.to_user_id === dbUser.id && r.from_user_id === user.id) ||
                    (r.from_user_id === dbUser.id && r.to_user_id === user.id)
                );
                return {
                    ...dbUser,
                    requestStatus: request?.status || null
                };
            });

            console.log('Mapped users:', mappedUsers);
            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error in fetchUsers:', error);
            setErrorMessage('Error fetching users: ' + error.message);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const { data: requests, error: requestsError } = await supabase
                .from('friend_requests')
                .select('id, from_user_id, status')
                .eq('to_user_id', user.id)
                .eq('status', 'pending');

            if (requestsError) throw requestsError;

            console.log('Pending requests:', requests);

            if (!requests || requests.length === 0) {
                setFriendRequests([]);
                return;
            }

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email')
                .in('id', requests.map(r => r.from_user_id));

            if (userError) throw userError;

            const enrichedRequests = requests.map(request => ({
                ...request,
                from_user_email: userData.find(u => u.id === request.from_user_id)?.email
            }));

            console.log('Enriched requests:', enrichedRequests);
            setFriendRequests(enrichedRequests);
        } catch (error) {
            console.error('Error in fetchFriendRequests:', error);
            setErrorMessage('Error fetching friend requests: ' + error.message);
        }
    };

    const unfriendUser = async (userId) => {
        try {
            const { error } = await supabase
                .from('friend_requests')
                .delete()
                .or(`from_user_id.eq.${user.id},to_user_id.eq.${userId},from_user_id.eq.${userId},to_user_id.eq.${user.id}`);

            if (error) throw error;

            // Refresh users list after unfriending
            await fetchUsers();
        } catch (error) {
            console.error('Error unfriending user:', error.message);
            setErrorMessage('Error unfriending user: ' + error.message);
        }
    };

    const sendFriendRequest = async (userId) => {
        try {
            const { error } = await supabase
                .from('friend_requests')
                .insert([{ from_user_id: user.id, to_user_id: userId, status: 'pending' }]);

            if (error) throw error;

            await fetchUsers();
        } catch (error) {
            setErrorMessage('Error sending friend request: ' + error.message);
        }
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

    const handlePopup = async (dbUserId) => {
        const userIsFriend = users.find(user => user.id === dbUserId && user.requestStatus === 'accepted');

        if (!userIsFriend) {
            router.push('/401');
            return;
        }

        setSelectedUserId(dbUserId);
        await fetchSecretMessage(dbUserId);

        // Show secret message as flash
        setFlashMessage(secretMessage);

        // Hide the flash message after 3 seconds
        setTimeout(() => {
            setFlashMessage('');
        }, 8000);
    };

    const acceptFriendRequest = async (requestId) => {
        try {
            const { error } = await supabase
                .from('friend_requests')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            if (error) throw error;

            await Promise.all([fetchFriendRequests(), fetchUsers()]);
        } catch (error) {
            setErrorMessage('Error accepting friend request: ' + error.message);
        }
    };

    const rejectFriendRequest = async (requestId) => {
        try {
            const { error } = await supabase
                .from('friend_requests')
                .delete()
                .eq('id', requestId);

            if (error) throw error;

            await Promise.all([fetchFriendRequests(), fetchUsers()]);
        } catch (error) {
            setErrorMessage('Error rejecting friend request: ' + error.message);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <NavBar />
            <div div className="container ">


                {errorMessage && <div>{errorMessage}</div>}

                <div div className="header3 text">
                    <h2>Friends Manager</h2>
                    <p>Available Users</p>
                    {users.length === 0 ? (
                        <p>No available users found</p>
                    ) : (
                        <div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Actions</th>
                                        <th>Secret Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((dbUser) => (
                                        <tr key={dbUser.id}>
                                            <td>{dbUser.email}</td>

                                            <td>
                                                {dbUser.requestStatus === 'accepted' ? (
                                                    <button onClick={() => unfriendUser(dbUser.id)}>
                                                        Unfriend
                                                    </button>
                                                ) : !dbUser.requestStatus ? (
                                                    <button onClick={() => sendFriendRequest(dbUser.id)}>
                                                        Send Friend Request
                                                    </button>
                                                ) : (
                                                    <span>{dbUser.requestStatus === 'pending' ? 'Request Pending' : 'Already Friends'}</span>
                                                )}
                                            </td>

                                            <td>
                                                {!dbUser.secretMessageShown ? (
                                                    <button
                                                        onClick={async () => {
                                                            await handlePopup(dbUser.id);
                                                            setUsers(prevUsers =>
                                                                prevUsers.map(user =>
                                                                    user.id === dbUser.id ? { ...user, secretMessageShown: true } : user
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        View Secret Message
                                                    </button>
                                                ) : (
                                                    <p>{secretMessage}</p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {friendRequests.length > 0 && (
                    <div>
                        <h2>Incoming Friend Requests</h2>
                        <div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {friendRequests.map((request) => (
                                        <tr key={request.id}>
                                            <td>{request.from_user_email}</td>
                                            <td>
                                                <button onClick={() => acceptFriendRequest(request.id)}>
                                                    Accept
                                                </button>
                                                <button onClick={() => rejectFriendRequest(request.id)}>
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Flash message */}
            {
                flashMessage && (
                    <div>
                        {flashMessage}
                    </div>
                )
            }
        </div >
    );
};

export default SecretPage3;
