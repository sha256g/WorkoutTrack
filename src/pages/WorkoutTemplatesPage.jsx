import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import WorkoutBuilder from '../components/WorkoutBuilder.jsx';
import ExerciseManager from '../components/ExerciseManager.jsx';
import WorkoutSessionLogger from './WorkoutSessionLogger.jsx';
import WorkoutHistoryPage from './WorkoutHistoryPage.jsx';
import SettingsPage from './SettingsPage.jsx';

// Main workout templates page component
export default function WorkoutTemplatesPage() {
    const workoutTemplates = useStore((state) => state.workoutTemplates);
    const initExercises = useStore((state) => state.initExercises);
    const initWorkoutTemplates = useStore((state) => state.initWorkoutTemplates);
    const initWorkoutHistory = useStore((state) => state.initWorkoutHistory);
    const initSettings = useStore((state) => state.initSettings);
    const removeWorkoutTemplate = useStore((state) => state.removeWorkoutTemplate);

    const [showBuilderModal, setShowBuilderModal] = useState(false);
    const [showExerciseManagerModal, setShowExerciseManagerModal] = useState(false);
    const [activeSessionTemplateId, setActiveSessionTemplateId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        initExercises();
        initWorkoutTemplates();
        initWorkoutHistory();
        initSettings();
    }, [initExercises, initWorkoutTemplates, initWorkoutHistory, initSettings]);

    const openBuilderModal = () => {
        setShowHistory(false);
        setShowSettings(false);
        setShowExerciseManagerModal(false);
        setShowBuilderModal(true);
    };
    const closeBuilderModal = () => setShowBuilderModal(false);

    const openExerciseManagerModal = () => {
        setShowHistory(false);
        setShowSettings(false);
        setShowBuilderModal(false);
        setShowExerciseManagerModal(true);
    };
    const closeExerciseManagerModal = () => setShowExerciseManagerModal(false);

    const startSession = (templateId) => {
        setShowHistory(false);
        setShowSettings(false);
        setActiveSessionTemplateId(templateId);
    };

    const endSessionAndCloseLogger = () => {
        setActiveSessionTemplateId(null);
    };

    const handleViewHistory = () => {
        setShowBuilderModal(false);
        setShowSettings(false);
        setShowHistory(true);
    };

    const handleViewSettings = () => {
        setShowBuilderModal(false);
        setShowHistory(false);
        setShowSettings(true);
    };

    // Handle deleting a workout template
    const handleDeleteTemplate = async (templateId, templateName) => {
        if (window.confirm(`Are you sure you want to delete the workout template "${templateName}"?\nThis will also delete all associated workout sessions from history.`)) {
            await removeWorkoutTemplate(templateId);
        }
    };

    if (activeSessionTemplateId) {
        return (
            <WorkoutSessionLogger
                templateId={activeSessionTemplateId}
                onClose={endSessionAndCloseLogger}
            />
        );
    }

    if (showHistory) {
        return (
            <WorkoutHistoryPage onClose={() => setShowHistory(false)} />
        );
    }

    if (showSettings) {
        return (
            <SettingsPage onClose={() => setShowSettings(false)} />
        );
    }

    return (
        <div className="bg-transparent w-full p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Your Workout Templates</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        className="btn btn-success w-full sm:w-auto"
                        onClick={openBuilderModal}
                    >
                        Create New Template
                    </button>
                    <button
                        className="btn btn-primary w-full sm:w-auto"
                        onClick={handleViewHistory}
                    >
                        View History
                    </button>
                    <button
                        className="btn btn-secondary w-full sm:w-auto"
                        onClick={handleViewSettings}
                    >
                        Settings
                    </button>
                    <button
                        className="btn btn-info w-full sm:w-auto"
                        onClick={openExerciseManagerModal}
                    >
                        Manage Exercises
                    </button>
                </div>
            </div>

            {workoutTemplates.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No workout templates created yet. Click the '+' button to build one!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workoutTemplates.map((template) => (
                        <div key={template.id} className="bg-gray-900 p-5 rounded-xl shadow-halo">
                            <div className="mb-5">
                                <h3 className="text-xl font-semibold text-indigo-400">{template.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {template.exercises.length} exercises planned
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    className="btn btn-success w-full sm:w-auto"
                                    onClick={() => startSession(template.id)}
                                >
                                    Start Workout
                                </button>
                                <button
                                    className="btn btn-danger w-full sm:w-auto"
                                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={openBuilderModal}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Create new workout template"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {showBuilderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-700/50">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-2xl transition-colors"
                            onClick={closeBuilderModal}
                        >
                            &times;
                        </button>
                        <WorkoutBuilder onClose={closeBuilderModal} />
                    </div>
                </div>
            )}

            {showExerciseManagerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-700/50">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-2xl transition-colors"
                            onClick={closeExerciseManagerModal}
                        >
                            &times;
                        </button>
                        <ExerciseManager />
                    </div>
                </div>
            )}
        </div>
    );
}