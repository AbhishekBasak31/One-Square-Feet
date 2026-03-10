import axios from "axios";

// Adjust base URL as needed
const API_BASE_URL = "http://localhost:7000/api/v1/refundpolicy";

export const refundPolicyApi = {
  // GET
  get: () => axios.get(`${API_BASE_URL}`),

  // POST (Create)
  create: (formData) =>
    axios.post(`${API_BASE_URL}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }),

  // PATCH (Update)
  update: (id, formData) =>
    axios.patch(`${API_BASE_URL}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }),

  // DELETE
  delete: (id) => 
    axios.delete(`${API_BASE_URL}/${id}`, { withCredentials: true }),
};