import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore.js';
import { formatTime } from '../utils/timerUtils.js'; // To format workout duration
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Import Chart.js components
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function WorkoutHistoryPage({ onClose }) {
    const workoutHistory = useStore((state) => state.workoutHistory);
    const exercises = useStore((state) => state.exercises);
    const initWorkoutHistory = useStore((state) => state.initWorkoutHistory);

    // State for chart filtering
    const [selectedExerciseId, setSelectedExerciseId] = useState('');
    const [displayMode, setDisplayMode] = useState('weight'); // 'weight', 'reps', 'volume'
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        initWorkoutHistory(); // Ensure history is loaded when this component mounts
        // Set initial selected exercise if available
        if (exercises.length > 0 && !selectedExerciseId) {
            setSelectedExerciseId(exercises[0].id);
        }
    }, [initWorkoutHistory, exercises, selectedExerciseId]);

    // Prepare data for the chart
    const chartData = useMemo(() => {
        if (!selectedExerciseId) {
            return { labels: [], datasets: [] };
        }

        const dataPoints = []; // Stores { date: 'YYYY-MM-DD', value: number, isPB: bool }

        // Collect all relevant logged sets for the selected exercise across all sessions
        workoutHistory.forEach(session => {
            // Date filter
            if (startDate && new Date(session.date) < startDate) return;
            if (endDate && new Date(session.date) > endDate) return;
            session.exercises.forEach(sessionEx => {
                if (sessionEx.exerciseId === selectedExerciseId) {
                    sessionEx.loggedSets.forEach(set => {
                        // Only consider main sets for now for charting progress
                        if (!set.parentSetId) {
                            let value = 0;
                            if (displayMode === 'weight') value = set.weight;
                            else if (displayMode === 'reps') value = set.reps;
                            else if (displayMode === 'volume') value = set.weight * set.reps;
                            dataPoints.push({
                                date: session.date, // Use the workout session date
                                value,
                                setType: displayMode, // For tooltip clarity
                                isPB: !!set.isPersonalBest,
                            });
                        }
                    });
                }
            });
        });

        // Sort data points by date for chronological display
        dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Extract labels (dates) and data values
        const labels = dataPoints.map(dp => dp.date);
        const data = dataPoints.map(dp => dp.value);
        const pbIndices = dataPoints.map((dp, idx) => dp.isPB ? idx : null).filter(idx => idx !== null);

        // Get the name of the selected exercise for the chart title
        const selectedExerciseName = exercises.find(ex => ex.id === selectedExerciseId)?.name || 'Selected Exercise';

        return {
            labels: labels,
            datasets: [
                {
                    label: `${selectedExerciseName} - ${displayMode === 'weight' ? 'Weight (kg)' : displayMode === 'reps' ? 'Reps' : 'Volume (kg*reps)'}`,
                    data: data,
                    borderColor: displayMode === 'weight' ? 'rgb(75, 192, 192)' : displayMode === 'reps' ? 'rgb(153, 102, 255)' : 'rgb(255, 205, 86)',
                    backgroundColor: displayMode === 'weight' ? 'rgba(75, 192, 192, 0.5)' : displayMode === 'reps' ? 'rgba(153, 102, 255, 0.5)' : 'rgba(255, 205, 86, 0.5)',
                    tension: 0.1, // Smooth the line
                    fill: false,
                    pointBackgroundColor: dataPoints.map(dp => dp.isPB ? '#FFD700' : undefined), // Gold for PBs
                    pointRadius: dataPoints.map(dp => dp.isPB ? 7 : 4),
                },
            ],
        };
    }, [selectedExerciseId, displayMode, workoutHistory, exercises, startDate, endDate]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Exercise Progress Over Time',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Date',
                },
                // For date display, consider using 'time' scale if dates are not uniform.
                // For simplicity, CategoryScale works if dates are just strings.
            },
            y: {
                title: {
                    display: true,
                    text: displayMode === 'weight' ? 'Weight (kg)' : displayMode === 'reps' ? 'Reps' : 'Volume (kg*reps)',
                },
                beginAtZero: true,
            },
        },
    };

    // Helper to get exercise name from ID (if needed outside chart data)
    const getExerciseName = (exerciseId) => {
        const exercise = exercises.find(ex => ex.id === exerciseId);
        return exercise ? exercise.name : 'Unknown Exercise';
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl max-w-4xl mx-auto my-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-indigo-700">Exercise Progress</h2>
                {onClose && (
                    <button
                        className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow"
                        onClick={onClose}
                    >
                        Close History
                    </button>
                )}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-4">
                {/* Exercise Selector */}
                <label htmlFor="exercise-select" className="font-semibold text-gray-700">Select Exercise:</label>
                <select
                    id="exercise-select"
                    className="border p-2 rounded-md bg-white min-w-[150px]"
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                >
                    {exercises.length === 0 ? (
                        <option value="">No exercises added yet</option>
                    ) : (
                        <>
                            <option value="">-- Choose Exercise --</option>
                            {exercises.map(ex => (
                                <option key={ex.id} value={ex.id}>{ex.name}</option>
                            ))}
                        </>
                    )}
                </select>

                {/* Toggle for Weight/Reps/Volume */}
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-md">
                    <button
                        className={`px-3 py-1 rounded-md text-sm font-medium ${displayMode === 'weight' ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setDisplayMode('weight')}
                    >
                        Weight
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md text-sm font-medium ${displayMode === 'reps' ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setDisplayMode('reps')}
                    >
                        Reps
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md text-sm font-medium ${displayMode === 'volume' ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setDisplayMode('volume')}
                    >
                        Volume
                    </button>
                </div>

                {/* Date Range Picker */}
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Date Range:</span>
                    <DatePicker
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        className="border p-2 rounded-md"
                        isClearable
                    />
                    <span>-</span>
                    <DatePicker
                        selected={endDate}
                        onChange={date => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="End Date"
                        className="border p-2 rounded-md"
                        isClearable
                    />
                </div>
            </div>

            {/* Future: Comparison and Distribution Charts UI goes here */}

            {selectedExerciseId && exercises.length > 0 && workoutHistory.length > 0 && chartData.labels.length > 0 ? (
                <div className="relative h-[400px] w-full"> {/* Define height for the chart */}
                    <Line data={chartData} options={chartOptions} />
                </div>
            ) : (
                <p className="text-gray-600 text-center">
                    {selectedExerciseId && chartData.labels.length === 0
                        ? 'No logged sets found for this exercise.'
                        : 'Please select an exercise to view its progress.'}
                </p>
            )}
        </div>
    );
}