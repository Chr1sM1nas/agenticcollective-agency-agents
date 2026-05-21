import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  loginWithEmail,
  registerWithEmail,
  verifyAge as verifyAgeAction,
  awardXp as awardXpAction,
  logoutUser as logoutUserAction,
  setAgeVerified as setAgeVerifiedAction,
} from '../store/authSlice';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error, identityStep } = useSelector((state: RootState) => state.auth);

  const login = (email: string, password: string) => {
    return dispatch(loginWithEmail({ email, password }));
  };

  const register = (displayName: string, email: string, password: string) => {
    return dispatch(registerWithEmail({ displayName, email, password }));
  };

  const logout = () => {
    return dispatch(logoutUserAction());
  };

  const setAgeVerified = () => {
    dispatch(setAgeVerifiedAction());
  };

  const verifyAge = (day: number, month: number, year: number) => {
    return dispatch(verifyAgeAction({ day, month, year }));
  };

  const awardXp = (xp: number) => {
    dispatch(awardXpAction(xp));
  };

  return { user, isLoading, error, identityStep, login, register, logout, setAgeVerified, verifyAge, awardXp };
}
