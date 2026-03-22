const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const TimetableEntry = require('../src/models/TimetableEntry');
const config = require('../src/config');

jest.mock('../src/config/database', () => jest.fn());
jest.mock('axios');
const axios = require('axios');

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let authToken;
const testUserId = new mongoose.Types.ObjectId().toString();

const generateTestToken = () => {
    return jwt.sign({ userId: testUserId }, config.jwt.secret, { expiresIn: '1h' });
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    authToken = generateTestToken();

    axios.get.mockImplementation((url) => {
        if (url.includes('/auth/validate')) {
            return Promise.resolve({
                data: {
                    valid: true,
                    data: {
                        userId: testUserId,
                        email: 'john@campus.edu',
                        studentId: 'IT20123456',
                        role: 'student',
                        firstName: 'John',
                        lastName: 'Doe',
                    },
                },
            });
        }
        if (url.includes('/courses/my')) {
            return Promise.resolve({
                data: {
                    success: true,
                    data: {
                        enrollments: [
                            {
                                courseId: {
                                    _id: 'course1',
                                    courseCode: 'SE4010',
                                    courseName: 'Current Trends in SE',
                                    instructor: 'Dr. Smith',
                                    semester: 7,
                                    schedule: { day: 'Monday', startTime: '09:00', endTime: '11:00', room: 'A101' },
                                },
                            },
                            {
                                courseId: {
                                    _id: 'course2',
                                    courseCode: 'CS3042',
                                    courseName: 'Database Systems',
                                    instructor: 'Dr. Jones',
                                    semester: 5,
                                    schedule: { day: 'Wednesday', startTime: '14:00', endTime: '16:00', room: 'B205' },
                                },
                            },
                        ],
                    },
                },
            });
        }
        return Promise.reject(new Error('Unknown URL'));
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await TimetableEntry.deleteMany({});
});

const sampleEntry = {
    courseId: 'course1',
    courseCode: 'SE4010',
    courseName: 'Current Trends in SE',
    day: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    room: 'A101',
    instructor: 'Dr. Smith',
};

describe('Timetable Service API', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.service).toBe('timetable-service');
        });
    });

    describe('POST /timetable', () => {
        it('should add a timetable entry', async () => {
            const res = await request(app)
                .post('/timetable')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sampleEntry);
            expect(res.status).toBe(201);
            expect(res.body.data.entry.courseCode).toBe('SE4010');
        });

        it('should detect time conflicts', async () => {
            await request(app)
                .post('/timetable')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sampleEntry);

            const res = await request(app)
                .post('/timetable')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ ...sampleEntry, courseId: 'course2', courseCode: 'CS3042', courseName: 'DB', startTime: '10:00', endTime: '12:00' });
            expect(res.status).toBe(409);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/timetable').send(sampleEntry);
            expect(res.status).toBe(401);
        });

        it('should return 400 for invalid data', async () => {
            const res = await request(app)
                .post('/timetable')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ courseId: 'x' });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /timetable', () => {
        beforeEach(async () => {
            await TimetableEntry.create({ ...sampleEntry, studentId: 'IT20123456', userId: testUserId });
        });

        it('should return student timetable', async () => {
            const res = await request(app)
                .get('/timetable')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.entries.length).toBe(1);
            expect(res.body.data.groupedByDay).toBeDefined();
        });

        it('should filter by day', async () => {
            const res = await request(app)
                .get('/timetable?day=Monday')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.entries.length).toBe(1);
        });
    });

    describe('POST /timetable/generate', () => {
        it('should generate timetable from Course Service', async () => {
            const res = await request(app)
                .post('/timetable/generate')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(201);
            expect(res.body.data.totalGenerated).toBe(2);
        });
    });

    describe('PUT /timetable/:id', () => {
        it('should update a timetable entry', async () => {
            const entry = await TimetableEntry.create({ ...sampleEntry, studentId: 'IT20123456', userId: testUserId });
            const res = await request(app)
                .put(`/timetable/${entry._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ room: 'C303' });
            expect(res.status).toBe(200);
            expect(res.body.data.entry.room).toBe('C303');
        });
    });

    describe('DELETE /timetable/:id', () => {
        it('should delete a timetable entry', async () => {
            const entry = await TimetableEntry.create({ ...sampleEntry, studentId: 'IT20123456', userId: testUserId });
            const res = await request(app)
                .delete(`/timetable/${entry._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /timetable', () => {
        it('should clear all entries', async () => {
            await TimetableEntry.create({ ...sampleEntry, studentId: 'IT20123456', userId: testUserId });
            const res = await request(app)
                .delete('/timetable')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('1');
        });
    });
});
