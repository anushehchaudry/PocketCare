import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiResponse {
  status: "success" | "error";
  message: string;
  errors?: string[];
  data?: any;
}

function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrftoken") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCsrfTokenFromCookie();

  // Create a new headers object that we can manipulate
  const headers = new Headers(options.headers);

  // Add CSRF token
  headers.set("X-CSRFToken", csrfToken || "");

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
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
  employment_status: string;
  income: number;
  visits_per_year: number;
  medications: string;
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

export async function updateProfile(data: any): Promise<ApiResponse> {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/update-profile/`,
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
      message: "Failed to update profile",
    };
  }
}

export const deleteProfile = async (): Promise<ApiResponse> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/delete-profile/`,
      {
        method: "POST",
      }
    );

    const responseData = await response.json();
    return {
      status: response.ok ? "success" : "error",
      message: responseData.message,
    };
  } catch (error) {
    console.error("Error deleting profile:", error);
    return { status: "error", message: "Failed to delete profile" };
  }
};
