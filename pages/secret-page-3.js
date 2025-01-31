import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import NavBar from '../components/NavBar';
import Link from 'next/link';
import { useRouter } from 'next/router';

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
                .or(`(from_user_id.eq.${user.id},to_user_id.eq.${userId}), (from_user_id.eq.${userId},to_user_id.eq.${user.id})`);

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



    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Friend Management</h1>

                {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {errorMessage}
                    </div>
                )}

                <div className="space-y-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Available Users</h2>
                        {users.length === 0 ? (
                            <p className="text-gray-500">No available users found</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Secret Message</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((dbUser) => (
                                            <tr key={dbUser.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {dbUser.email}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {dbUser.requestStatus === 'accepted' ? (
                                                        <button
                                                            onClick={() => unfriendUser(dbUser.id)}
                                                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                                        >
                                                            Unfriend
                                                        </button>
                                                    ) : !dbUser.requestStatus ? (
                                                        <button
                                                            onClick={() => sendFriendRequest(dbUser.id)}
                                                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                                        >
                                                            Send Friend Request
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-500 italic">
                                                            {dbUser.requestStatus === 'pending' ? 'Request Pending' : 'Already Friends'}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="inline-block align-middle">
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
                                                            className="text-blue-500 hover:underline"
                                                        >
                                                            View Secret Message
                                                        </button>
                                                    ) : (
                                                        <p className="text-gray-700">{secretMessage}</p>
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
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Incoming Friend Requests</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {friendRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {request.from_user_email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => acceptFriendRequest(request.id)}
                                                        className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => rejectFriendRequest(request.id)}
                                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                                    >
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
            </div>

            {/* Flash message */}
            {flashMessage && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded shadow-md">
                    {flashMessage}
                </div>
            )}
        </div>
    );
};

export default SecretPage3;