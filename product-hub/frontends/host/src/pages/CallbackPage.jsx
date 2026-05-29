import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager } from '../shared/auth';

function CallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        userManager.signinRedirectCallback()
            .then(() => navigate('/'))
            .catch((err) => {
                console.error('OIDC callback error:', err);
                navigate('/');
            });
    }, [navigate]);

    return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
}

export default CallbackPage;

