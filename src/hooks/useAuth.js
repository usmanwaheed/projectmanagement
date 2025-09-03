import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getCompanyLogo,
  getUserData,
  loginUser,
  logoutUser,
  promoteUser,
  signUpUser,
  updateCompanyLogo,
} from '../api/authApi';
import { useAuth } from '../context/AuthProvider';
import { RouteNames } from '../Constants/route';

export const useSignup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signUpUser,
    onSuccess: (data) => {
      // Don't set tokens here, just handle success
      queryClient.invalidateQueries(['authData']);
    },
    onError: (error) => {
      console.error('(useSignup) Signup failed:', error.response?.data || error.message);
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const token = data.data.accessToken;
      const refreshToken = data.data.refreshToken;
      const role = data.data.user.role;
      if (role && token && refreshToken) {
        localStorage.setItem('userRole', role);
        localStorage.setItem('userToken', token); // Consistent with getTokens()
        localStorage.setItem('userRefreshToken', refreshToken); // Consistent with getTokens()
        queryClient.invalidateQueries(['authData']);
        queryClient.invalidateQueries(['userProfile']);
        setTimeout(() => {
          if (role === 'company') {
            navigate('/dashboard');
          } else if (role === 'user' || role === 'QcAdmin') {
            navigate('/dashboard');
          } else {
            navigate('/home');
            console.error('Missing token or refreshToken in response');
          }
        }, 1000)
      }
    },
    onError: (error) => {
      console.error('(useLogin) Login failed:', error.response?.data || error.message);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { setAccessToken } = useAuth(); // Assuming useAuth provides this

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear all user-related data
      queryClient.clear();
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRefreshToken');
      localStorage.removeItem('role');

      // Don't clear admin tokens as they're for superadmin
      // localStorage.removeItem('accessAdminToken');
      // localStorage.removeItem('refreshAdminToken');
      // localStorage.removeItem('roleAdmin');

      // if (setAccessToken) {
      //   setAccessToken(null);
      // }
    },
    onError: (error) => {
      console.error("(useAuth) Logout failed:", error.message || error);
      // Even if logout fails on server, clear local storage
      // localStorage.removeItem('userToken');
      // localStorage.removeItem('refreshToken');
      // localStorage.removeItem('role');
    }
  });
};

// Promote user Hook
export const usePromoteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promoteUser,
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh user lists
      queryClient.invalidateQueries(['companyUsers']);
      queryClient.invalidateQueries(['userProfile']);
    },
    onError: (error) => {
      console.error('(usePromoteUser) Promotion failed:', error.response?.data || error.message);
    }
  });
};


// ===================== Company Logo Hooks =====================

export const useUpdateCompanyLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompanyLogo,
    onSuccess: (data) => {
      // Update both user data and any company logo queries
      queryClient.invalidateQueries(['userData']);
      queryClient.invalidateQueries(['companyLogo']);
    },
    onError: (error) => {
      console.error('(useUpdateCompanyLogo) Failed to update logo:', error.response?.data || error.message);
    }
  });
};

export const useCompanyLogo = (companyId) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['companyLogo', companyId],
    queryFn: () => getCompanyLogo(companyId),
    enabled: !!accessToken && !!companyId, // Only run if companyId exists
    staleTime: 1000 * 60 * 60, // 1 hour cache
    onError: (error) => {
      console.error('(useCompanyLogo) Failed to fetch company logo:', error);
    }
  });
};

export const useMyCompanyLogo = () => {
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: getUserData,
  });

  const companyId = userData?.data?.role === 'company'
    ? userData.data._id
    : userData?.data?.companyId?._id;

  return useCompanyLogo(companyId);
};