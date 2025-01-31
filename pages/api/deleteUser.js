import { supabaseServiceClient } from '../../utils/supabaseClient';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        try {
            // Use the service role client to delete the user
            const { error } = await supabaseServiceClient.auth.admin.deleteUser(userId);

            if (error) {
                console.error('Supabase delete user error:', error);
                throw new Error(error.message);
            }

            // Optional: Delete user's related data in other tables
            const { error: dataDeleteError } = await supabaseServiceClient
                .from('secret_messages')
                .delete()
                .eq('user_id', userId);

            if (dataDeleteError) {
                console.warn('Error deleting user data:', dataDeleteError);
            }

            return res.status(200).json({ message: 'User account deleted successfully' });
        } catch (error) {
            console.error('Delete user handler error:', error);
            return res.status(500).json({ error: error.message });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}