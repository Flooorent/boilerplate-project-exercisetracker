const Joi = require('joi')
const httpStatus = require('http-status')
const mongo = require('mongodb')

const { client: mongoClient, dbName, usersCollection, exercisesCollection } = require('../config/mongo')

const NUM_HEX_CHAR_FOR_MONGO_ID = 24

const exerciseSchema = Joi.object().keys({
    userId: Joi.string().min(NUM_HEX_CHAR_FOR_MONGO_ID).max(NUM_HEX_CHAR_FOR_MONGO_ID).regex(/^[a-f0-9]+$/).required(),
    description: Joi.string().min(1).required(),
    duration: Joi.number().integer().min(1).required(),
    date: Joi.date().iso()
})

function validateExercise(req, res, next) {
    const { error, value } = Joi.validate(req.body, exerciseSchema)

    if(error) {
        error.statusCode = httpStatus.BAD_REQUEST
        return next(error)
    }

    req.body = value

    if(!req.body.date) {
        req.body.date = new Date()
    }

    req.body.date = req.body.date.toISOString().split('T')[0]

    return next()
}

function addExercise(req, res, next) {
    const { userId, description, duration, date } = req.body
    const db = mongoClient.db(dbName)

    db.collection(usersCollection).findOne({ _id: mongo.ObjectID(userId) }, function(userErr, userResult) {
        if(userErr) {
            return next(userErr)
        }

        if(!userResult) {
            const err = new Error()
            err.statusCode = httpStatus.BAD_REQUEST
            err.message = "Field 'userId' doesn't match any user ids"
            return next(err)
        }

        db.collection(exercisesCollection).insertOne({ userId, description, duration, date }, function(exoErr, exoResult) {
            if(exoErr) {
                return next(exoErr)
            }

            return res.status(httpStatus.OK).json({
                _id: userId,
                username: userResult.username,
                description,
                duration,
                date
            })
        })
    })
}

module.exports = {
    addExercise,
    validateExercise,
    NUM_HEX_CHAR_FOR_MONGO_ID,
}
