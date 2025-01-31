import { supabaseServiceClient } from '../../utils/supabaseClient';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ error: 'User ID and message are required' });
        }

        try {
            const { data, error } = await supabaseServiceClient
                .from('secret_messages')
                .upsert(
                    { user_id: userId, message: message, updated_at: new Date() },
                    { onConflict: ['user_id'] }
                );

            if (error) {
                throw new Error(error.message);
            }

            return res.status(200).json({ message: 'Secret message saved successfully', data });
        } catch (error) {
            console.error('Error saving secret message:', error);
            return res.status(500).json({ error: error.message });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}
