import React from 'react';
import { useStore } from '../store/useStore.js';

// Utility to convert array of objects to CSV
function arrayToCSV(data) {
    if (!data || !data.length) return '';
    const keys = Object.keys(data[0]);
    const csvRows = [keys.join(',')];
    for (const row of data) {
        csvRows.push(keys.map(k => JSON.stringify(row[k] ?? '')).join(','));
    }
    return csvRows.join('\n');
}

// Utility to trigger a download
function downloadCSV(filename, csv) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function SettingsPage({ onClose }) {
    const settings = useStore((state) => state.settings);
    const setSetting = useStore((state) => state.setSetting);
    const workoutHistory = useStore((state) => state.workoutHistory);
    const exercises = useStore((state) => state.exercises);
    const workoutTemplates = useStore((state) => state.workoutTemplates);

    const handleRestTimeChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0) {
            setSetting('defaultRestTime', value);
        }
    };

    const handleExport = () => {
        if (workoutHistory && workoutHistory.length) {
            downloadCSV('workout_history.csv', arrayToCSV(workoutHistory));
        }
        if (exercises && exercises.length) {
            downloadCSV('exercises.csv', arrayToCSV(exercises));
        }
        if (workoutTemplates && workoutTemplates.length) {
            downloadCSV('workout_templates.csv', arrayToCSV(workoutTemplates));
        }
        alert('Export complete!');
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl max-w-2xl mx-auto my-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-indigo-700">Settings</h2>
                {onClose && (
                    <button
                        className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow"
                        onClick={onClose}
                    >
                        Close
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* Default Rest Time Setting */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200">
                    <label htmlFor="defaultRestTime" className="text-lg font-medium text-gray-800 flex-grow">
                        Default Rest Time (seconds)
                    </label>
                    <input
                        id="defaultRestTime"
                        type="number"
                        min="0"
                        className="border p-2 rounded-md w-24 text-center text-lg"
                        value={settings.defaultRestTime}
                        onChange={handleRestTimeChange}
                    />
                </div>

                {/* Export Data Button */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200">
                    <span className="text-lg font-medium text-gray-800">Export your data</span>
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow"
                        onClick={handleExport}
                    >
                        Export Data (CSV)
                    </button>
                </div>

                {/* Add more settings here as needed */}
                {/* <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200">
          <span className="text-lg font-medium text-gray-800">Play sound on timer end</span>
          <input type="checkbox" className="form-checkbox h-6 w-6 text-indigo-600" />
        </div> */}
            </div>
        </div>
    );
}