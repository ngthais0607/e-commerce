export const addressView = {
  list(addresses: unknown) {
    if (!Array.isArray(addresses)) {
      return [];
    }
    return addresses.map((addr: Record<string, unknown>) => ({
      ...addr,
      userId: (addr as { clientId?: unknown; userId?: unknown }).clientId || (addr as { userId?: unknown }).userId,
    }));
  },

  detail(address: Record<string, unknown> | null) {
    if (!address) {
      return null;
    }
    const a = address as Record<string, unknown>;
    return {
      ...a,
      userId: (a as { clientId?: unknown; userId?: unknown }).clientId || (a as { userId?: unknown }).userId,
    };
  },
};


