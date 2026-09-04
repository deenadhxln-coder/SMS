import { create } from 'zustand';

export const getStoredUser = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('sms_user') : null;
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const getStoredToken = () => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('sms_token') : null;
  } catch (_) {
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  
  login: (user, token) => {
    try {
      localStorage.setItem('sms_user', JSON.stringify(user));
      localStorage.setItem('sms_token', token);
    } catch (_) {}
    set({ user, token });
  },

  logout: () => {
    try {
      localStorage.removeItem('sms_user');
      localStorage.removeItem('sms_token');
    } catch (_) {}
    set({ user: null, token: null });
  },

  updateUser: (updatedUser) => {
    const currentUser = getStoredUser() || {};
    const newUser = { ...currentUser, ...updatedUser };
    try {
      localStorage.setItem('sms_user', JSON.stringify(newUser));
    } catch (_) {}
    set({ user: newUser });
  }
}));

export default useAuthStore;

