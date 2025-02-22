import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // This is important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include CSRF token
api.interceptors.request.use((config) => {
  const token = getCsrfToken();
  if (token) {
    config.headers['X-CSRFToken'] = token;
  }
  return config;
});

interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  errors?: string[];
  data?: any;
}

// Store CSRF token in memory
let storedCsrfToken: string | null = null;

// Function to get CSRF token from cookies or memory
function getCsrfToken(): string | null {
  if (storedCsrfToken) return storedCsrfToken;
  
  const name = 'csrftoken';
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        storedCsrfToken = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return storedCsrfToken;
}

// Update stored CSRF token from response headers
function updateCsrfToken(response: any) {
  const newToken = response.headers['x-csrftoken'];
  if (newToken) {
    storedCsrfToken = newToken;
  }
}

// Add response interceptor to update CSRF token
api.interceptors.response.use(
  (response) => {
    updateCsrfToken(response);
    return response;
  },
  (error) => {
    if (error.response) {
      updateCsrfToken(error.response);
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string): Promise<ApiResponse> {
  try {
    const response = await api.post('/api/login/', { email, password });
    updateCsrfToken(response);
    return {
      status: 'success',
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        status: 'error',
        message: error.response.data.message || 'Invalid credentials',
      };
    }
    return {
      status: 'error',
      message: 'Failed to connect to server',
    };
  }
}

export interface QuestionnaireData {
  name: string;
  age: number;
  pre_existing_conditions: string;
  overall_health: string;
}

export async function saveQuestionnaire(data: QuestionnaireData): Promise<ApiResponse> {
  try {
    const response = await api.post('/api/save-questionnaire/', data);
    updateCsrfToken(response);
    return {
      status: 'success',
      message: response.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        status: 'error',
        message: error.response.data.message || 'Failed to save questionnaire',
      };
    }
    return {
      status: 'error',
      message: 'Failed to connect to server',
    };
  }
}

export async function checkQuestionnaireStatus(): Promise<ApiResponse> {
  try {
    const response = await api.get('/api/check-questionnaire/');
    updateCsrfToken(response);
    return {
      status: 'success',
      message: response.data.message || '',
      data: {
        hasCompleted: response.data.hasCompleted,
        ...response.data.data
      }
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // If unauthorized, throw error to trigger redirect
      if (error.response.status === 401) {
        throw error;
      }
      return {
        status: 'error',
        message: error.response.data.message || 'Failed to check status',
      };
    }
    return {
      status: 'error',
      message: 'Failed to connect to server',
    };
  }
}

export async function analyzeBill(file: File, question: string): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);

    const response = await api.post('/api/analyze-bill/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    updateCsrfToken(response);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        status: 'error',
        message: error.response.data.message || 'Failed to analyze bill',
      };
    }
    return {
      status: 'error',
      message: 'Failed to connect to server',
    };
  }
}

export async function compareInsurance(file1: File, file2: File, question: string): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);
    formData.append('question', question);

    const response = await api.post('/api/compare-insurance/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    updateCsrfToken(response);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        status: 'error',
        message: error.response.data.message || 'Failed to compare insurance',
      };
    }
    return {
      status: 'error',
      message: 'Failed to connect to server',
    };
  }
}

export async function logout(): Promise<ApiResponse> {
  try {
    const response = await api.post('/api/logout/');
    updateCsrfToken(response);
    return {
      status: 'success',
      message: response.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        status: 'error',
        message: error.response.data.message || 'Failed to logout',
      };
    }
    return {
      status: 'error',
      message: 'Failed to connect to server',
    };
  }
}

export async function register(email: string, password: string, confirmPassword: string): Promise<ApiResponse> {
  try {
    if (password !== confirmPassword) {
      return {
        status: 'error',
        message: 'Passwords do not match',
      };
    }

    const response = await api.post('/api/register/', {
      email: email,
      password: password,
      confirmPassword: confirmPassword
    });

    const data = response.data;
    return {
      status: response.status === 200 ? 'success' : 'error',
      message: data.message || 'Registration failed',
      errors: data.errors ? data.errors : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to connect to server',
    };
  }
}