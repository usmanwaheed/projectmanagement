import { axiosInstance } from "../../../api/axiosInstance";


// Create a new subscription (Company only)
export const createSubscription = async (subscriptionData) => {
    try {
        // const response = await axiosInstance.post("/subscriptions", subscriptionData);
        const response = await axiosInstance.post("/superadmin/subscriptions", subscriptionData);
        return response.data;
    } catch (error) {
        console.error("createSubscription error:", error.response?.data || error.message);
        throw error;
    }
};

// Confirm subscription payment (for 3D Secure payments)
export const confirmSubscriptionPayment = async (confirmationData) => {
    try {
        const response = await axiosInstance.post('/superadmin/subscriptions/confirm-payment', confirmationData);
        return response.data;
    } catch (error) {
        console.error('Confirm payment error:', error.response?.data || error.message);
        throw error;
    }
};

// Get current active subscription
export const fetchCurrentSubscription = async () => {
    try {
        const response = await axiosInstance.get("/superadmin/subscriptions/current");
        return response.data;
    } catch (error) {
        console.error("fetchCurrentSubscription error:", error.response?.data || error.message);
        throw error;
    }
};

// Get subscription history
export const fetchSubscriptionHistory = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const url = `/superadmin/subscriptions/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error("fetchSubscriptionHistory error:", error.response?.data || error.message);
        throw error;
    }
};

// Cancel a subscription (Company only)
export const cancelSubscription = async (subscriptionId, reason = null) => {
    try {
        const response = await axiosInstance.delete(`/superadmin/subscriptions/${subscriptionId}`, {
            data: { reason }
        });
        return response.data;
    } catch (error) {
        console.error("cancelSubscription error:", error.response?.data || error.message);
        throw error;
    }
};

// Change subscription plan (Company only)
export const changeSubscriptionPlan = async ({ id, newPlanId, reason }) => {
    try {
        const response = await axiosInstance.put(`/superadmin/subscriptions/${id}/change-plan`, {
            newPlanId,
            reason,
        });
        return response.data;
    } catch (error) {
        console.error("changeSubscriptionPlan error:", error.response?.data || error.message);
        throw error;
    }
};

// Update subscription status (Dev mode - for manual testing)
export const updateSubscriptionStatus = async (subscriptionId, status, reason) => {
    try {
        const response = await axiosInstance.post(`/subscriptions/update-status`, {
            subscriptionId,
            status,
            reason
        });
        return response.data;
    } catch (error) {
        console.error("updateSubscriptionStatus error:", error.response?.data || error.message);
        throw error;
    }
};

// ----------------- ADMIN ROUTES -----------------

// Get all subscriptions (Admin only)
export const fetchAllSubscriptions = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.planId) queryParams.append('planId', params.planId);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

        const url = `/superadmin/subscriptions/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error("fetchAllSubscriptions error:", error.response?.data || error.message);
        throw error;
    }
};

// Get subscription analytics (Admin only)
export const fetchSubscriptionAnalytics = async () => {
    try {
        const response = await axiosInstance.get("/superadmin/subscriptions/analytics");
        return response.data;
    } catch (error) {
        console.error("fetchSubscriptionAnalytics error:", error.response?.data || error.message);
        throw error;
    }
};

// Toggle subscription status (Admin only)
export const toggleSubscriptionStatus = async (subscriptionId) => {
    try {
        const response = await axiosInstance.patch(`/superadmin/subscriptions/${subscriptionId}/toggle-status`);
        return response.data;
    } catch (error) {
        console.error("toggleSubscriptionStatus error:", error.response?.data || error.message);
        throw error;
    }
};

// Check expiring trials (Admin only)
export const checkExpiringTrials = async () => {
    try {
        const response = await axiosInstance.get('/subscriptions/check-expiring-trials');
        return response.data;
    } catch (error) {
        console.error('Check expiring trials error:', error.response?.data || error.message);
        throw error;
    }
};

// Dev sync subscription with Stripe (Admin only - for development)
export const syncSubscriptionWithStripe = async (subscriptionId) => {
    try {
        const response = await axiosInstance.post(`/subscriptions/dev-sync/${subscriptionId}`);
        return response.data;
    } catch (error) {
        console.error('Sync subscription error:', error.response?.data || error.message);
        throw error;
    }
};

// ----------------- ADDITIONAL UTILITY FUNCTIONS -----------------

// Get subscription invoice (if implemented in backend)
export const fetchSubscriptionInvoice = async (invoiceId) => {
    try {
        const response = await axiosInstance.get(`/subscriptions/invoice/${invoiceId}`);
        return response.data;
    } catch (error) {
        console.error('Fetch invoice error:', error.response?.data || error.message);
        throw error;
    }
};

// Get upcoming invoice preview (if implemented in backend)
export const fetchUpcomingInvoice = async (subscriptionId) => {
    try {
        const response = await axiosInstance.get(`/subscriptions/${subscriptionId}/upcoming-invoice`);
        return response.data;
    } catch (error) {
        console.error('Fetch upcoming invoice error:', error.response?.data || error.message);
        throw error;
    }
};

// Update payment method (if implemented in backend)
export const updatePaymentMethod = async (paymentMethodData) => {
    try {
        const response = await axiosInstance.post('/subscriptions/update-payment-method', paymentMethodData);
        return response.data;
    } catch (error) {
        console.error('Update payment method error:', error.response?.data || error.message);
        throw error;
    }
};