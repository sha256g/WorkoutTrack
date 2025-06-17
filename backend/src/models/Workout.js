import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  exercises: [{
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String,
    category: String,
    sets: [{
      reps: Number,
      weight: Number,
      notes: String,
      timestamp: Date
    }]
  }],
  startTime: Date,
  endTime: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
workoutSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout; 