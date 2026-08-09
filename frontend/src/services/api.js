import axios from "axios";


const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});


/* =========================
   JWT INTERCEPTOR
========================= */

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


/* =========================
   AUTH APIs
========================= */

export const loginUser = async (username, password) => {

  const response = await api.post(
    "/login",
    {
      username: username,
      password: password,
    }
  );

  return response.data;
};


export const getCurrentUser = async () => {

  const response = await api.get("/me");

  return response.data;
};


/* =========================
   LEAVE APIs
========================= */

export const getMyLeaveBalances = async () => {

  const response = await api.get(
    "/my-leave-balances"
  );

  return response.data;
};


export const applyLeave = async (leaveData) => {
  const response = await api.post(
    "/leave-requests",
    leaveData
  );

  return response.data;
};


export const getLeaveTypes = async () => {
  const response = await api.get("/leave-types");

  return response.data;
};

export const getMyLeaveRequests = async () => {
  const response = await api.get(
    "/my-leave-requests"
  );

  return response.data;
};


export const getManagerLeaveRequests = async () => {
  const response = await api.get("/manager/leave-requests");

  return response.data;
};


export const approveLeaveRequest = async (requestId) => {
  const response = await api.put(
    `/manager/leave-requests/${requestId}/approve`
  );

  return response.data;
};

export const rejectLeaveRequest = async (requestId) => {
  const response = await api.put(
    `/manager/leave-requests/${requestId}/reject`
  );

  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/users");

  return response.data;
};


export const createLeaveType = async (data) => {
  const response = await api.post(
    "/leave-types",
    data
  );

  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/users", data);

  return response.data;
};

export const updateLeaveType = async (leaveTypeId, data) => {
  const response = await api.put(
    `/leave-types/${leaveTypeId}`,
    data
  );

  return response.data;
};

export const deleteLeaveType = async (leaveTypeId) => {
  const response = await api.delete(
    `/leave-types/${leaveTypeId}`
  );

  return response.data;
};

export default api;
