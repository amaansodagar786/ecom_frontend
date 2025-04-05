import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userJson = searchParams.get('user');
    
    try {
      const user = JSON.parse(decodeURIComponent(userJson));
      if (token && user) {
        window.opener.postMessage({ token, user }, window.location.origin);
      }
    } catch (error) {
      window.opener.postMessage({ error: 'Authentication failed' }, window.location.origin);
    }
    window.close();
  }, [searchParams]);

  return (
    <div className="auth-processing">
      <h2>Authentication in progress...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
};

export default AuthCallback;