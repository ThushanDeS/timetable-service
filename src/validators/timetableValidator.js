const Joi = require('joi');

const createEntrySchema = Joi.object({
    courseId: Joi.string().required(),
    courseCode: Joi.string().trim().required(),
    courseName: Joi.string().trim().required(),
    day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday').required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
        .messages({ 'string.pattern.base': 'Start time must be in HH:MM format' }),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
        .messages({ 'string.pattern.base': 'End time must be in HH:MM format' }),
    room: Joi.string().trim().allow(''),
    instructor: Joi.string().trim().allow(''),
    semester: Joi.number().integer().min(1).max(8),
    color: Joi.string().trim(),
    notes: Joi.string().max(500).allow(''),
});

const updateEntrySchema = Joi.object({
    day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    room: Joi.string().trim().allow(''),
    instructor: Joi.string().trim().allow(''),
    color: Joi.string().trim(),
    notes: Joi.string().max(500).allow(''),
}).min(1);

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: error.details.map((d) => d.message),
        });
    }
    req.body = value;
    next();
};

module.exports = { createEntrySchema, updateEntrySchema, validate };
