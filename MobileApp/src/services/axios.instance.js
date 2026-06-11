import axios from 'axios';
import {API_URL} from '../config/env';

const instance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {"Content-Type": "application/json"},
});

// Add interceptors later (auth tokens, refresh)
export default instance;
