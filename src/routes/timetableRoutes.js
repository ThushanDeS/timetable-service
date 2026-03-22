const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/timetableController');
const { authenticate } = require('../middleware/auth');
const { validate, createEntrySchema, updateEntrySchema } = require('../validators/timetableValidator');

/**
 * @swagger
 * /timetable:
 *   get:
 *     summary: Get student's timetable
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *     responses:
 *       200:
 *         description: Timetable entries grouped by day
 */
router.get('/', authenticate, ctrl.getTimetable);

/**
 * @swagger
 * /timetable/generate:
 *   post:
 *     summary: Auto-generate timetable from enrolled courses (calls Course Service)
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       **Inter-service communication**: This endpoint calls the Course Service
 *       at GET /courses/my to fetch the student's enrolled courses, then generates
 *       timetable entries from each course's schedule data.
 *     responses:
 *       201:
 *         description: Timetable generated from enrolled courses
 *       404:
 *         description: No enrolled courses found
 *       502:
 *         description: Course Service unavailable
 */
router.post('/generate', authenticate, ctrl.generateTimetable);

/**
 * @swagger
 * /timetable:
 *   post:
 *     summary: Add a timetable entry manually
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, courseCode, courseName, day, startTime, endTime]
 *             properties:
 *               courseId:
 *                 type: string
 *               courseCode:
 *                 type: string
 *                 example: SE4010
 *               courseName:
 *                 type: string
 *                 example: Current Trends in SE
 *               day:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "11:00"
 *               room:
 *                 type: string
 *               instructor:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entry added
 *       409:
 *         description: Time conflict
 */
router.post('/', authenticate, validate(createEntrySchema), ctrl.addEntry);

/**
 * @swagger
 * /timetable/{id}:
 *   put:
 *     summary: Update a timetable entry
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entry updated
 *       404:
 *         description: Entry not found
 */
router.put('/:id', authenticate, validate(updateEntrySchema), ctrl.updateEntry);

/**
 * @swagger
 * /timetable/{id}:
 *   delete:
 *     summary: Remove a timetable entry
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entry removed
 */
router.delete('/:id', authenticate, ctrl.deleteEntry);

/**
 * @swagger
 * /timetable:
 *   delete:
 *     summary: Clear entire timetable
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timetable cleared
 */
router.delete('/', authenticate, ctrl.clearTimetable);

module.exports = router;
