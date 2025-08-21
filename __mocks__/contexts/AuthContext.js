module.exports = {
  useAuth: () => ({
    user: null,
    profile: null,
    isAuthenticated: false,
    isConsistent: true,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  })
};

