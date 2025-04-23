import { useContext } from 'react';
import AuthContext from './AuthContext';

// Export the useAuth hook
const useAuth = () => useContext(AuthContext);

export default useAuth;
