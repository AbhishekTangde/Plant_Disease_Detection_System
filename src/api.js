const API_URL = 'http://localhost:5000/api';

export const api = {
  // Users
  getUsers: async () => fetch(`${API_URL}/users`).then(r => r.json()),
  registerUser: async (data) => fetch(`${API_URL}/users`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),
  updateUser: async (id, data) => fetch(`${API_URL}/users/${id}`, {
    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteUser: async (id) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' }).then(r => r.json()),

  // Orders
  getOrders: async (userId) => fetch(`${API_URL}/orders/${userId}`).then(r => r.json()),
  createOrder: async (data) => fetch(`${API_URL}/orders`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),

  // Scans
  getScans: async (userId) => fetch(`${API_URL}/scans/${userId}`).then(r => r.json()),
  createScan: async (data) => fetch(`${API_URL}/scans`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),

  // Posts
  getPosts: async () => fetch(`${API_URL}/posts`).then(r => r.json()),
  createPost: async (data) => fetch(`${API_URL}/posts`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),

  // Replies
  getReplies: async (postId) => fetch(`${API_URL}/posts/${postId}/replies`).then(r => r.json()),
  createReply: async (postId, data) => fetch(`${API_URL}/posts/${postId}/replies`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),
};
