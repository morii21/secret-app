// pages/api/deleteUser.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // 1. Delete from secret_messages table
        const { error: messagesError } = await supabaseAdmin
            .from('secret_messages')
            .delete()
            .eq('user_id', userId);

        if (messagesError) {
            console.error('Error deleting secret messages:', messagesError);
            return res.status(500).json({ error: 'Failed to delete user messages: ' + messagesError.message });
        }

        // 2. Delete from public.users table using RPC
        const { error: publicUserError } = await supabaseAdmin.rpc('delete_user_data', {
            user_id_param: userId
        });

        if (publicUserError) {
            console.error('Error deleting from public users:', publicUserError);
            return res.status(500).json({ error: 'Failed to delete from public users: ' + publicUserError.message });
        }

        // 3. Delete from auth.users
        const { error: authError } = await supabaseAdmin
            .auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Error deleting auth user:', authError);
            return res.status(500).json({ error: 'Failed to delete auth user: ' + authError.message });
        }

        return res.status(200).json({ message: 'User and all related data deleted successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({
            error: 'Internal server error: ' + (error.message || 'Unknown error')
        });
    }
}