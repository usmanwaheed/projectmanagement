import { useState, useEffect } from 'react';
import { useUpdateTask } from '../../hooks/useTask';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Radio, RadioGroup,
    FormControlLabel, FormLabel, InputAdornment, Alert,
    MenuItem
} from '@mui/material';

const EditTextDialog = ({ open, handleClose, task }) => {
    const [formData, setFormData] = useState({
        projectTitle: '',
        teamLeadName: '',
        description: '',
        dueDate: '',
        budget: '',
        budgetType: 'fixed',
        link: '',
        projectStatus: '',
        points: ''
    });

    const [errors, setErrors] = useState({});
    const { mutate: updateTask, isLoading, error } = useUpdateTask();

    // Populate form data when task changes
    useEffect(() => {
        if (task) {
            setFormData({
                projectTitle: task.projectTitle || '',
                teamLeadName: Array.isArray(task.teamLeadName)
                    ? task.teamLeadName.join(', ')
                    : task.teamLeadName || '',
                description: task.description || '',
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                budget: task.budget || '',
                budgetType: task.budgetType || 'fixed',
                link: task.link || '',
                projectStatus: task.projectStatus || '',
                points: task.points || ''
            });
        }
    }, [task]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.projectTitle.trim()) {
            newErrors.projectTitle = 'Project title is required';
        }

        if (!formData.teamLeadName.trim()) {
            newErrors.teamLeadName = 'Team leads are required';
        }

        if (formData.budget && parseFloat(formData.budget) <= 0) {
            newErrors.budget = formData.budgetType === 'hourly'
                ? 'Hourly rate must be greater than 0'
                : 'Budget must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm() || !task) {
            return;
        }

        // Prepare update data
        const updateData = {
            projectTitle: formData.projectTitle,
            teamLeadName: formData.teamLeadName,
            description: formData.description,
            projectStatus: formData.projectStatus,
            points: formData.points ? parseInt(formData.points) : undefined,
            budgetType: formData.budgetType,
            link: formData.link
        };

        // Add budget if provided
        if (formData.budget) {
            updateData.budget = parseFloat(formData.budget);
        }

        // Add due date if provided
        if (formData.dueDate) {
            updateData.dueDate = formData.dueDate;
        }

        // Remove undefined/empty values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === '' || updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        updateTask({
            taskId: task._id,
            updateData
        }, {
            onSuccess: () => {
                setErrors({});
                handleClose();
            },
            onError: (error) => {
                console.error('Error updating task:', error);
            }
        });
    };

    const handleDialogClose = () => {
        setErrors({});
        handleClose();
    };

    // Get budget label and placeholder based on budget type
    const getBudgetLabel = () => {
        return formData.budgetType === 'hourly' ? 'Hourly Rate' : 'Fixed Budget';
    };

    const getBudgetPlaceholder = () => {
        return formData.budgetType === 'hourly' ? 'Enter hourly rate' : 'Enter total budget';
    };

    if (!task) return null;

    return (
        <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Project</DialogTitle>

            <DialogContent>
                <Stack spacing={3} sx={{ pt: 2 }}>
                    {/* Show general error if any */}
                    {error && (
                        <Alert severity="error">
                            {error?.message || 'Something went wrong. Please try again.'}
                        </Alert>
                    )}

                    <TextField
                        name="projectTitle"
                        label="Project Title"
                        value={formData.projectTitle}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.projectTitle}
                        helperText={errors.projectTitle}
                        placeholder="Enter project title"
                    />

                    <TextField
                        name="teamLeadName"
                        label="Team Leads (comma separated)"
                        value={formData.teamLeadName}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.teamLeadName}
                        helperText={errors.teamLeadName || "Enter team lead names separated by commas"}
                        placeholder="John Doe, Jane Smith"
                    />

                    <TextField
                        name="description"
                        label="Description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Enter project description"
                    />

                    <TextField
                        name="dueDate"
                        label="Due Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.dueDate}
                        onChange={handleChange}
                        fullWidth
                        helperText="Leave empty to keep current date"
                    />

                    {/* Budget Type Selection */}
                    <div>
                        <FormLabel component="legend" sx={{ mb: 1 }}>
                            Budget Type
                        </FormLabel>
                        <RadioGroup
                            row
                            name="budgetType"
                            value={formData.budgetType}
                            onChange={handleChange}
                        >
                            <FormControlLabel
                                value="fixed"
                                control={<Radio />}
                                label="Fixed Budget"
                            />
                            <FormControlLabel
                                value="hourly"
                                control={<Radio />}
                                label="Hourly Rate"
                            />
                        </RadioGroup>
                    </div>

                    {/* Budget Input */}
                    <TextField
                        name="budget"
                        label={getBudgetLabel()}
                        type="number"
                        value={formData.budget}
                        onChange={handleChange}
                        fullWidth
                        error={!!errors.budget}
                        helperText={errors.budget}
                        placeholder={getBudgetPlaceholder()}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            endAdornment: formData.budgetType === 'hourly' && (
                                <InputAdornment position="end">/hr</InputAdornment>
                            )
                        }}
                        inputProps={{
                            min: 0,
                            step: formData.budgetType === 'hourly' ? "0.01" : "1"
                        }}
                    />

                    <TextField
                        name="projectStatus"
                        label="Project Status"
                        value={formData.projectStatus}
                        onChange={handleChange}
                        fullWidth
                        select
                    >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                    </TextField>

                    <TextField
                        name="points"
                        label="Points"
                        type="number"
                        value={formData.points}
                        onChange={handleChange}
                        fullWidth
                        placeholder="Enter points"
                        inputProps={{
                            min: 0
                        }}
                    />

                    <TextField
                        name="link"
                        label="Project Link"
                        value={formData.link}
                        onChange={handleChange}
                        fullWidth
                        placeholder="https://example.com"
                        type="url"
                        helperText="Optional project reference link"
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleDialogClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isLoading}
                >
                    {isLoading ? 'Updating...' : 'Update Project'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTextDialog;