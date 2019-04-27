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

const logSchema = Joi.object().keys({
    userId: Joi.string().min(NUM_HEX_CHAR_FOR_MONGO_ID).max(NUM_HEX_CHAR_FOR_MONGO_ID).regex(/^[a-f0-9]+$/).required(),
    from: Joi.date().iso(),
    to: Joi.date().iso(),
    limit: Joi.number().integer().min(1)
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

function validateLog(req, res, next) {
    const { error, value } = Joi.validate(req.query, logSchema)

    if(error) {
        error.statusCode = httpStatus.BAD_REQUEST
        return next(error)
    }

    req.query = value

    if(req.query.from) {
        req.query.from = req.query.from.toISOString().split('T')[0]
    }

    if(req.query.to) {
        req.query.to = req.query.to.toISOString().split('T')[0]
    }

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

function getExercises(req, res, next) {
    const db = mongoClient.db(dbName)

    db.collection(usersCollection).findOne({ _id: mongo.ObjectID(req.query.userId) }, function(userErr, userResult) {
        if(userErr) {
            return next(userErr)
        }

        if(!userResult) {
            const err = new Error()
            err.statusCode = httpStatus.BAD_REQUEST
            err.message = "Field 'userId' doesn't match any user ids"
            return next(err)
        }

        const query = { userId: req.query.userId }

        if(req.query.from) {
            query.date = {}
            query.date.$gte = req.query.from
        }

        if(req.query.to) {
            if(!query.date) {
                query.date = {}
            }

            query.date.$lte = req.query.to
        }

        const options = {
            projection: {
                description: 1,
                duration: 1,
                date: 1,
                _id: 0
            }
        }
        
        if(req.query.limit) {
            options.limit = req.query.limit
        }

        db.collection(exercisesCollection).find(query, options).toArray(function(err, result) {
            if(err) {
                return next(err)
            }

            const count = result.length

            return res.status(httpStatus.OK).json({
                _id: userResult._id,
                username: userResult.username,
                log: result,
                count
            })
        })
    })
}

module.exports = {
    addExercise,
    getExercises,
    validateExercise,
    validateLog,
    NUM_HEX_CHAR_FOR_MONGO_ID,
}
