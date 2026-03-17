import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loginWithEmail, logout as logoutAction, setAgeVerified as setAgeVerifiedAction } from '../store/authSlice';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error, identityStep } = useSelector((state: RootState) => state.auth);

  const login = (email: string, password: string) => {
    return dispatch(loginWithEmail({ email, password }));
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const setAgeVerified = () => {
    dispatch(setAgeVerifiedAction());
  };

  return { user, isLoading, error, identityStep, login, logout, setAgeVerified };
}
