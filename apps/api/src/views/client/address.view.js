export const addressView = {
  list(addresses) {
    if (!Array.isArray(addresses)) {
      return [];
    }
    return addresses.map(addr => ({
      ...addr,
      userId: addr.clientId || addr.userId, // Map clientId to userId for frontend
    }));
  },

  detail(address) {
    if (!address) {
      return null;
    }
    return {
      ...address,
      userId: address.clientId || address.userId, // Map clientId to userId for frontend
    };
  },
};


