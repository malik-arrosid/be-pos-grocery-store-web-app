const clients = new Map();

export const addClient = (userId, response) => {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }

  clients.get(userId).add(response);
};

export const removeClient = (userId, response) => {
  const responses = clients.get(userId);

  if (!responses) {
    return;
  }

  responses.delete(response);

  if (responses.size === 0) {
    clients.delete(userId);
  }
};

export const getClient = (userId) => {
  return clients.get(userId) ?? new Set();
};

export const getClients = () => {
  return clients;
};

export const clearClients = () => {
  clients.clear();
};