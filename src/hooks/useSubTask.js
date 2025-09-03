import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteSubTask, updateSubTask } from "../api/userSubTask";


export const useDeleteSubTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSubTask,

        onMutate: async (taskId) => {
            // Cancel ongoing fetches
            await queryClient.cancelQueries(['userSubtask']);
            // Snapshot of the current cached data
            const previousTasks = queryClient.getQueryData(['userSubtask']);
            // Optimistically update the cache
            queryClient.setQueryData(['userSubtask'], (oldTasks = []) => {
                // Ensure `oldTasks` is an array and filter out the deleted task
                return Array.isArray(oldTasks)
                    ? oldTasks.filter((task) => task.id !== taskId)
                    : [];
            });
            // Return the snapshot for rollback
            return { previousTasks };
        },

        onError: (error, taskId, context) => {
            console.error('Error deleting task:', error.message);
            // Rollback to the previous state if mutation fails
            if (context?.previousTasks) {
                queryClient.setQueryData(['userSubtask'], context.previousTasks);
            }
        },

        onSettled: () => {
            // Ensure data is refetched after mutation to sync with server
            queryClient.invalidateQueries(['userSubtask']);
        },
    });
};



export const useUpdateSubTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, updateData }) => updateSubTask(taskId, updateData),

        onSuccess: (data) => {
            queryClient.invalidateQueries(['userSubtask'])
            queryClient.setQueryData(['userSubtask', data.data._id], data.data);
            toast.success("Task Updated Successfully", {
                position: "top-center",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: false,
            })
        },
        onError: (data) => {
            toast.error(data.response?.data?.message, {
                position: "top-center",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: false,
            })
        }
    })
}
