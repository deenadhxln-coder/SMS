import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('sms_user')) || null,
  token: localStorage.getItem('sms_token') || null,
  
  login: (user, token) => {
    localStorage.setItem('sms_user', JSON.stringify(user));
    localStorage.setItem('sms_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('sms_user');
    localStorage.removeItem('sms_token');
    set({ user: null, token: null });
  },

  updateUser: (updatedUser) => {
    const currentUser = JSON.parse(localStorage.getItem('sms_user')) || {};
    const newUser = { ...currentUser, ...updatedUser };
    localStorage.setItem('sms_user', JSON.stringify(newUser));
    set({ user: newUser });
  }
}));

export default useAuthStore;
