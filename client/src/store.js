import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('token') || null,
  
  // Data
  servers: [],
  currentServer: null,
  currentChannel: null,
  messages: [],
  members: [],
  
  // Voice
  voiceChannelId: null,
  voiceUsers: [],
  
  // UI
  typingUsers: {},
  
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  
  setServers: (servers) => set({ servers }),
  setCurrentServer: (server) => set({ currentServer: server, currentChannel: null, messages: [], members: server?.members || [] }),
  setCurrentChannel: (channel) => set({ currentChannel: channel, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMembers: (members) => set({ members }),
  
  setVoiceChannelId: (id) => set({ voiceChannelId: id }),
  addVoiceUser: (user) => set((state) => ({ voiceUsers: [...state.voiceUsers.filter(u => u.userId !== user.userId), user] })),
  removeVoiceUser: (userId) => set((state) => ({ voiceUsers: state.voiceUsers.filter(u => u.userId !== userId) })),
  setVoiceUsers: (users) => set({ voiceUsers: users }),
  
  setTypingUsers: (typingUsers) => set({ typingUsers }),
  addTypingUser: (userId, username) => set((state) => ({ typingUsers: { ...state.typingUsers, [userId]: username } })),
  removeTypingUser: (userId) => set((state) => {
    const { [userId]: _, ...rest } = state.typingUsers;
    return { typingUsers: rest };
  }),
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, servers: [], currentServer: null, currentChannel: null, messages: [], members: [], voiceChannelId: null, voiceUsers: [] });
  }
}));

export default useStore;
