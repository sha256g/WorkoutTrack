import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export default function SetManager({ workoutId, exerciseId }) {
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [parentSetId, setParentSetId] = useState(null); // null = main set
    const sets = useStore((state) => state.sets);
    const addSet = useStore((state) => state.addSet);
    const initSetsForWorkout = useStore((state) => state.initSetsForWorkout);

    // Load sets for this workout on mount
    useEffect(() => {
        initSetsForWorkout(workoutId);
    }, [workoutId, initSetsForWorkout]);

    // Group sets: main sets and their sub-sets
    const mainSets = sets.filter(
        (s) => s.exerciseId === exerciseId && !s.parentSetId
    );
    const subSets = sets.filter(
        (s) => s.exerciseId === exerciseId && s.parentSetId
    );

    const getSubSets = (setId) =>
        subSets.filter((s) => s.parentSetId === setId);

    const handleAddSet = async (e) => {
        e.preventDefault();
        if (!reps) return;
        await addSet({
            id: Date.now(),
            workoutId,
            exerciseId,
            reps,
            weight,
            notes,
            parentSetId, // null for main set, or set id for sub-set
        });
        setReps('');
        setWeight('');
        setNotes('');
        setParentSetId(null);
        // Optionally reload sets here if not auto-updating
        await initSetsForWorkout(workoutId);
    };

    return (
        <div className="p-4">
            <h2 className="font-bold mb-2">Sets for this Exercise</h2>
            <form onSubmit={handleAddSet} className="flex gap-2 mb-4">
                <input
                    className="border px-2 py-1 w-16"
                    type="number"
                    min="0"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="Reps"
                />
                <input
                    className="border px-2 py-1 w-20"
                    type="number"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Weight"
                />
                <input
                    className="border px-2 py-1"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes"
                />
                <select
                    className="border px-2 py-1"
                    value={parentSetId || ''}
                    onChange={(e) =>
                        setParentSetId(e.target.value ? Number(e.target.value) : null)
                    }
                >
                    <option value="">Main Set</option>
                    {mainSets.map((set, idx) => (
                        <option key={set.id} value={set.id}>
                            Add as sub-set to Set {idx + 1}
                        </option>
                    ))}
                </select>
                <button className="bg-green-600 text-white px-3 py-1 rounded" type="submit">
                    Add Set
                </button>
            </form>
            <ul>
                {mainSets.map((set, idx) => (
                    <li key={set.id} className="mb-2">
                        <div>
                            <span className="font-semibold">Set {idx + 1}:</span>{' '}
                            {set.reps} reps @ {set.weight}kg
                            {set.notes && <span className="ml-2 text-gray-500">({set.notes})</span>}
                        </div>
                        <ul className="ml-6">
                            {getSubSets(set.id).map((subSet, subIdx) => (
                                <li key={subSet.id}>
                  <span className="font-semibold">
                    Set {idx + 1}.{String.fromCharCode(97 + subIdx)}:
                  </span>{' '}
                                    {subSet.reps} reps @ {subSet.weight}kg
                                    {subSet.notes && <span className="ml-2 text-gray-500">({subSet.notes})</span>}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}