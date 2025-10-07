import axios from 'axios';

// Default to backend on localhost:8000; allow REACT_APP_API_URL override.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Event endpoints
export const getEvents = async () => {
  try {
    const response = await api.get('/api/events/');
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const getNearbyEvents = async (lat, lng, radius = 10) => {
  try {
    const response = await api.get('/api/events/nearby', {
      params: { lat, lng, radius_km: radius }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby events:', error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/api/events/', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/api/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Auth endpoints
export const signup = async ({ email_or_phone, password, role = 'user' }) => {
  try {
    const res = await api.post('/auth/signup', { email_or_phone, password, role });
    return res.data;
  } catch (error) {
    console.error('Error during signup:', error);
    throw error;
  }
};

export const login = async ({ email_or_phone, password }) => {
  try {
    const res = await api.post('/auth/login', { email_or_phone, password });
    return res.data; // { access_token, token_type, role }
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Add authentication interceptor if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
