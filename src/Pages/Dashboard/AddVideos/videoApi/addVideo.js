/* eslint-disable react-hooks/rules-of-hooks */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../../api/axiosInstance";
import { useAuth } from "../../../../context/AuthProvider";


// VIDEO API"S 
// Upload The Video Code 
const addVideo = async (data) => {
    try {
        const response = await axiosInstance.post('/user/video-upload', data);
        const result = response.data;
        return response.data;
    } catch (error) {
        console.log("Error from addVideo (Dashboard/AddVideos)", error);
    }
}
export const useAddVideo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addVideo,
        onSuccess: (data) => {
            queryClient.setQueryData(['useUploadVideo'], data)
        }
    })
}

// Get All Videos Data Code
const fetchVideos = async () => {
    try {
        const response = await axiosInstance.get('/user/get-video-upload');
        return response.data;
    } catch (error) {
        console.error("Error fetching videos:", error);
        throw error;
    }
};
export const useFetchVideos = () => {
    const { accessToken } = useAuth();
    return useQuery({
        queryKey: ['useUploadVideo'],
        enabled: !!accessToken,
        queryFn: fetchVideos,
    })
}

// Delete Video Code
const deleteVideo = async (videoId) => {
    try {
        const response = await axiosInstance.delete(`/user/delete-video/${videoId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const useDeleteVideo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteVideo,
        onSuccess: () => {
            // Invalidate the videos query to refetch the updated list
            queryClient.invalidateQueries(['useUploadVideo']);
        }
    })
}

// Get Single Video Data Code
const getSingleVideo = async (videoId) => {
    const response = await axiosInstance.get(`/user/get-single-video-upload/${videoId}`)
    return response.data
}
export const usegetSingleVideo = (videoId) => {
    const { accessToken } = useAuth();
    return useQuery({
        queryKey: ['useUploadVideo', videoId],
        queryFn: () => getSingleVideo(videoId),
        enabled: !!accessToken && !!videoId,
    })
}

// Search Videos
const searchVideos = async (query) => {
    try {
        const response = await axiosInstance.get(`/user/search-videos?query=${query}`);
        return response.data;
    } catch (error) {
        console.error("Error searching videos:", error);
        throw error;
    }
};

export const useSearchVideos = (query) => {
    const { accessToken } = useAuth();
    return useQuery({
        queryKey: ['searchVideos', query],
        queryFn: () => searchVideos(query),
        enabled: !!accessToken && !!query,
    });
};



// PDF API"S 
// Upload PDF
const addPdf = async (data) => {
    try {
        const response = await axiosInstance.post('/user/pdf-upload', data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading PDF:", error);
        throw error;
    }
};

export const useAddPdf = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addPdf,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['pdfUploads']);
        },
    });
};


// Get All PDFs
const fetchPdfs = async () => {
    try {
        const response = await axiosInstance.get('/user/get-all-pdfs');
        return response.data;
    } catch (error) {
        console.error("Error fetching PDFs:", error);
        throw error;
    }
};

export const useFetchPdfs = () => {
    const { accessToken } = useAuth();
    return useQuery({
        queryKey: ['pdfUploads'],
        enabled: !!accessToken,
        queryFn: fetchPdfs,
    });
};


// Delete PDF
const deletePdf = async (publicId) => {
    try {
        const response = await axiosInstance.delete(`/user/delete-pdf/${publicId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting PDF:", error);
        throw error;
    }
};

export const useDeletePdf = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePdf,
        onSuccess: () => {
            queryClient.invalidateQueries(["pdfUploads"]);
        },
    });
};

// Search PDFs
const searchPdfs = async (query) => {
    try {
        const response = await axiosInstance.get(`/user/search-pdfs?query=${query}`);
        return response.data;
    } catch (error) {
        console.error("Error searching PDFs:", error);
        throw error;
    }
};

export const useSearchPdfs = (query) => {
    const { accessToken } = useAuth();
    return useQuery({
        queryKey: ['searchPdfs', query],
        queryFn: () => searchPdfs(query),
        enabled: !!accessToken && !!query,
    });
};