import { useState } from 'react';
import { useCreateTask } from '../../hooks/useTask';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Radio, RadioGroup,
    FormControlLabel, FormLabel, InputAdornment, Alert
} from '@mui/material';

const TextDialog = ({ open, handleClose }) => {
    const [formData, setFormData] = useState({
        projectTitle: '',
        teamLeadName: '',
        description: '',
        dueDate: '',
        budget: '',
        budgetType: 'fixed',
        link: ''
    });

    // Add validation state
    const [errors, setErrors] = useState({});

    const { mutate: createTask, isLoading, error } = useCreateTask();

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

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        if (!formData.budget || parseFloat(formData.budget) <= 0) {
            newErrors.budget = formData.budgetType === 'hourly'
                ? 'Hourly rate must be greater than 0'
                : 'Budget must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Convert budget to number before sending
        const taskData = {
            ...formData,
            budget: parseFloat(formData.budget)
        };

        createTask(taskData, {
            onSuccess: () => {
                setFormData({
                    projectTitle: '',
                    teamLeadName: '',
                    description: '',
                    dueDate: '',
                    budget: '',
                    budgetType: 'fixed',
                    link: ''
                });
                setErrors({});
                handleClose();
            },
            onError: (error) => {
                console.error('Error creating task:', error);
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

    return (
        <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Project</DialogTitle>

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
                        required
                        error={!!errors.dueDate}
                        helperText={errors.dueDate}
                        inputProps={{
                            min: new Date().toISOString().split('T')[0] // Prevent past dates
                        }}
                    />

                    {/* Budget Type Selection */}
                    <div>
                        <FormLabel component="legend" sx={{ mb: 1 }}>
                            Budget Type <span style={{ color: 'red' }}>*</span>
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
                        required
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
                        name="link"
                        label="Project Link"
                        value={formData.link}
                        onChange={handleChange}
                        fullWidth
                        placeholder="https://example.com"
                        type="url"
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
                    {isLoading ? 'Creating...' : 'Create Project'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TextDialog;