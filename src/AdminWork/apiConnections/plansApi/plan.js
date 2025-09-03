import { axiosInstance } from "../../../api/axiosInstance";

// ----------------- PUBLIC -----------------
export const fetchPublicPlans = async () => {
    const response = await axiosInstance.get('/superadmin/plans/publicPlans');
    return response.data.data;
};

export const fetchSinglePublicPlan = async (id) => {
    const response = await axiosInstance.get(`/superadmin/plans/publicPlans/${id}`);
    return response.data.data;
};

// ----------------- ADMIN ------------------
export const fetchAllPlans = async () => {
    const response = await axiosInstance.get('/superadmin/plans/manage');
    return response.data.data;
};

export const fetchSingleAdminPlan = async (id) => {
    const response = await axiosInstance.get(`/superadmin/plans/singlePlan/${id}`);
    return response.data.data;
};

export const createPlan = async (planData) => {
    const response = await axiosInstance.post('/superadmin/plans/manage', planData);
    return response.data.data;
};

export const updatePlan = async ({ id, updatedData }) => {
    const response = await axiosInstance.put(`/superadmin/plans/singlePlan/${id}`, updatedData);
    return response.data.data;
};

export const deletePlan = async (id) => {
    const response = await axiosInstance.delete(`/superadmin/plans/singlePlan/${id}`);
    return response.data;
};

export const togglePlanStatus = async (id) => {
    const response = await axiosInstance.patch(`/superadmin/plans/planStatus/${id}/toggle-status`);
    return response.data;
};
