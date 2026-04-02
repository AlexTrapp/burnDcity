import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  username: null,
  login: (username) => set({ username }),
  logout: () => set({ username: null }),
}))
