// API client for interacting with the Django backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiResponse {
  status: "success" | "error";
  message: string;
  errors?: string[];
  data?: any;
}

// Store CSRF token in memory
let storedCsrfToken: string | null = null;

// Function to get CSRF token from cookies or memory
function getCsrfToken(): string | null {
  if (storedCsrfToken) return storedCsrfToken;

  const name = "csrftoken";
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        storedCsrfToken = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return storedCsrfToken;
}

// Update stored CSRF token from response headers
function updateCsrfToken(response: Response) {
  const newToken = response.headers.get("X-CSRFToken");
  if (newToken) {
    storedCsrfToken = newToken;
  }
}

// Base fetch function with auth credentials
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getCsrfToken();
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      "X-CSRFToken": token || "",
    },
  });

  updateCsrfToken(response);
  return response;
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return {
      status: response.ok ? "success" : "error",
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to connect to server",
    };
  }
}

export async function register(
  email: string,
  password: string,
  confirmPassword: string
): Promise<ApiResponse> {
  try {
    if (password !== confirmPassword) {
      return {
        status: "error",
        message: "Passwords do not match",
      };
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/api/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      }),
    });

    const data = await response.json();
    return {
      status: response.ok ? "success" : "error",
      message: data.message || "Registration failed",
      errors: data.errors ? data.errors : undefined,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to connect to server",
    };
  }
}

export async function analyzeBill(file: File, question: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("question", question);

  const response = await fetchWithAuth(`${API_BASE_URL}/api/analyze-bill/`, {
    method: "POST",
    body: formData,
  });
  return response.json();
}

export async function compareInsurance(
  file1: File,
  file2: File,
  question: string
) {
  const formData = new FormData();
  formData.append("file1", file1);
  formData.append("file2", file2);
  formData.append("question", question);

  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/compare-insurance/`,
    {
      method: "POST",
      body: formData,
    }
  );
  return response.json();
}

export async function logout(): Promise<ApiResponse> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/logout/`, {
      method: "POST",
    });

    const data = await response.json();
    return {
      status: response.ok ? "success" : "error",
      message: data.message,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to connect to server",
    };
  }
}

export interface QuestionnaireData {
  name: string;
  age: number;
  pre_existing_conditions: string;
  overall_health: string;
}

export async function saveQuestionnaire(
  data: QuestionnaireData
): Promise<ApiResponse> {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/save-questionnaire/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const responseData = await response.json();
    return {
      status: response.ok ? "success" : "error",
      message: responseData.message,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to save questionnaire",
    };
  }
}

export async function checkQuestionnaireStatus(): Promise<ApiResponse> {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/check-questionnaire/`,
      {
        method: "GET",
      }
    );

    const data = await response.json();
    return {
      status: response.ok ? "success" : "error",
      message: data.message || "",
      data: {
        hasCompleted: data.hasCompleted,
        ...data.data,
      },
    };
  } catch (error) {
    console.error("Error checking questionnaire status:", error);
    return {
      status: "error",
      message: "Failed to check questionnaire status",
    };
  }
}

export async function getUsername(): Promise<ApiResponse> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/get-username/`, {
      method: "GET",
    });

    const data = await response.json();
    return {
      status: response.ok ? "success" : "error",
      message: data.message || "",
      data: data.username,
    };
  } catch (error) {
    console.error("Error fetching username:", error);
    return {
      status: "error",
      message: "Failed to fetch username",
    };
  }
}
