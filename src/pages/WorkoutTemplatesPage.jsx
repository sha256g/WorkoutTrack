import React, { useState, useEffect, useCallback } from 'react';
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
        setShowBuilderModal(true);
    };
    const closeBuilderModal = () => setShowBuilderModal(false);

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
        <div className="relative min-h-screen bg-gray-900">
            <div className="flex justify-between items-center mb-6 p-4">
                <h2 className="text-2xl font-bold text-white">Your Workout Templates</h2>
                <div className="flex gap-3">
                    <button
                        className="btn btn-primary"
                        onClick={handleViewHistory}
                    >
                        View History
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleViewSettings}
                    >
                        Settings
                    </button>
                </div>
            </div>

            <div className="px-4">
                {workoutTemplates.length === 0 ? (
                    <p className="text-gray-400">No workout templates created yet. Click the '+' button to build one!</p>
                ) : (
                    <ul className="space-y-4">
                        {workoutTemplates.map((template) => (
                            <li key={template.id} className="bg-gray-800 p-5 rounded-2xl shadow-lg flex justify-between items-center hover:bg-gray-750 transition-colors border border-gray-700/50">
                                <div className="flex-grow">
                                    <h3 className="text-xl font-semibold text-indigo-400">{template.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        {template.exercises.length} exercises planned
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="btn btn-success"
                                        onClick={() => startSession(template.id)}
                                    >
                                        Start Workout
                                    </button>
                                    <button
                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                                        aria-label={`Delete ${template.name}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm6 3a1 1 0 100 2h-2a1 1 0 100 2h2a1 1 0 100 2H8a1 1 0 01-1-1v-4a1 1 0 011-1h5z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                className="fixed bottom-6 right-6 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-2xl w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-all duration-200 border border-blue-400/20 hover:shadow-blue-500/25 active:scale-95"
                onClick={openBuilderModal}
            >
                +
            </button>

            {/* Modal */}
            {showBuilderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-700/50">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-2xl transition-colors"
                            onClick={closeBuilderModal}
                        >
                            &times;
                        </button>
                        <WorkoutBuilder />
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <ExerciseManager />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}