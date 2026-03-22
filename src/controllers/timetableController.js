const axios = require('axios');
const TimetableEntry = require('../models/TimetableEntry');
const config = require('../config');

/**
 * GET /timetable
 * Get the authenticated student's timetable.
 */
const getTimetable = async (req, res, next) => {
    try {
        const studentId = req.user.studentId || req.query.studentId;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const { day } = req.query;
        const filter = { studentId, isActive: true };
        if (day) {
            filter.day = day;
        }

        const entries = await TimetableEntry.find(filter).sort({ day: 1, startTime: 1 });

        // Group by day for easy consumption
        const groupedByDay = {};
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        dayOrder.forEach((d) => { groupedByDay[d] = []; });
        entries.forEach((entry) => {
            groupedByDay[entry.day].push(entry);
        });

        res.status(200).json({
            success: true,
            data: { entries, groupedByDay, totalEntries: entries.length },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /timetable/generate
 * Auto-generate timetable from enrolled courses by calling Course Service.
 * KEY INTER-SERVICE COMMUNICATION: Timetable → Course Service
 */
const generateTimetable = async (req, res, next) => {
    try {
        const { studentId, userId } = req.user;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        // INTER-SERVICE CALL: Fetch enrolled courses from Course Service
        let enrolledCourses = [];
        try {
            const courseResponse = await axios.get(
                `${config.courseService.url}/courses/my`,
                {
                    headers: { Authorization: req.headers.authorization },
                    params: { studentId },
                    timeout: 10000,
                }
            );

            if (courseResponse.data.success) {
                enrolledCourses = courseResponse.data.data.enrollments || [];
            }
        } catch (courseError) {
            return res.status(502).json({
                success: false,
                message: 'Unable to fetch enrolled courses from Course Service',
                error: courseError.message,
            });
        }

        if (enrolledCourses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No enrolled courses found. Please enroll in courses first.',
            });
        }

        // Clear existing timetable entries for this student
        await TimetableEntry.deleteMany({ studentId });

        // Generate timetable entries from course schedules
        const colors = ['#4A90D9', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#3498DB'];
        const createdEntries = [];

        for (let i = 0; i < enrolledCourses.length; i++) {
            const enrollment = enrolledCourses[i];
            const course = enrollment.courseId || enrollment;

            if (course.schedule && course.schedule.day) {
                try {
                    const entry = await TimetableEntry.create({
                        studentId,
                        userId,
                        courseId: course._id || course.id,
                        courseCode: course.courseCode,
                        courseName: course.courseName,
                        day: course.schedule.day,
                        startTime: course.schedule.startTime || '09:00',
                        endTime: course.schedule.endTime || '11:00',
                        room: course.schedule.room || 'TBA',
                        instructor: course.instructor || '',
                        semester: course.semester,
                        color: colors[i % colors.length],
                    });
                    createdEntries.push(entry);
                } catch (err) {
                    // Skip conflicting entries
                    if (err.code !== 11000) {
                        throw err;
                    }
                }
            }
        }

        res.status(201).json({
            success: true,
            message: `Timetable generated with ${createdEntries.length} entries from ${enrolledCourses.length} enrolled courses`,
            data: { entries: createdEntries, totalGenerated: createdEntries.length },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /timetable
 * Add a single timetable entry manually.
 */
const addEntry = async (req, res, next) => {
    try {
        const { studentId, userId } = req.user;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        // Check for time conflicts
        const conflict = await TimetableEntry.findOne({
            studentId,
            day: req.body.day,
            isActive: true,
            $or: [
                { startTime: { $lt: req.body.endTime }, endTime: { $gt: req.body.startTime } },
            ],
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: `Time conflict with ${conflict.courseName} (${conflict.startTime}-${conflict.endTime})`,
            });
        }

        const entry = await TimetableEntry.create({
            ...req.body,
            studentId,
            userId,
        });

        res.status(201).json({
            success: true,
            message: 'Timetable entry added',
            data: { entry },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /timetable/:id
 * Update a timetable entry.
 */
const updateEntry = async (req, res, next) => {
    try {
        const entry = await TimetableEntry.findOneAndUpdate(
            { _id: req.params.id, studentId: req.user.studentId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Timetable entry not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Timetable entry updated',
            data: { entry },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /timetable/:id
 * Remove a timetable entry.
 */
const deleteEntry = async (req, res, next) => {
    try {
        const entry = await TimetableEntry.findOneAndDelete({
            _id: req.params.id,
            studentId: req.user.studentId,
        });

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Timetable entry not found' });
        }

        res.status(200).json({ success: true, message: 'Timetable entry removed' });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /timetable
 * Clear all timetable entries for the student.
 */
const clearTimetable = async (req, res, next) => {
    try {
        const result = await TimetableEntry.deleteMany({ studentId: req.user.studentId });

        res.status(200).json({
            success: true,
            message: `Cleared ${result.deletedCount} timetable entries`,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTimetable,
    generateTimetable,
    addEntry,
    updateEntry,
    deleteEntry,
    clearTimetable,
};
