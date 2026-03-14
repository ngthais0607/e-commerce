export const authView = {
  authResponse({ user, token }: { user: Record<string, unknown>; token: string }) {
    return { user, token };
  },

  profile(user: Record<string, unknown>) {
    return user;
  },
};


