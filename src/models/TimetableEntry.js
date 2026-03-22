const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: [true, 'Student ID is required'],
            trim: true,
            index: true,
        },
        userId: {
            type: String,
            required: [true, 'User ID is required'],
        },
        courseId: {
            type: String,
            required: [true, 'Course ID is required'],
        },
        courseCode: {
            type: String,
            required: [true, 'Course code is required'],
            trim: true,
        },
        courseName: {
            type: String,
            required: [true, 'Course name is required'],
            trim: true,
        },
        day: {
            type: String,
            required: [true, 'Day is required'],
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        startTime: {
            type: String,
            required: [true, 'Start time is required'],
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'],
        },
        endTime: {
            type: String,
            required: [true, 'End time is required'],
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'],
        },
        room: {
            type: String,
            trim: true,
            default: 'TBA',
        },
        instructor: {
            type: String,
            trim: true,
            default: '',
        },
        semester: {
            type: Number,
            min: 1,
            max: 8,
        },
        color: {
            type: String,
            default: '#4A90D9',
        },
        notes: {
            type: String,
            maxlength: 500,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Prevent duplicate schedule entries
timetableEntrySchema.index(
    { studentId: 1, day: 1, startTime: 1, courseId: 1 },
    { unique: true }
);

const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema);

module.exports = TimetableEntry;
