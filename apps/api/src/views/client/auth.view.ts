export const authView = {
  authResponse({ user, token }) {
    return { user, token };
  },

  profile(user) {
    return user;
  },
};


