const Joi = require('joi')
const httpStatus = require('http-status')

const { userSchema } = require('./schemas')
const { client: mongoClient, dbName, usersCollection } = require('../config/mongo')


function getAllUsers(req, res, next) {
    const collection = mongoClient.db(dbName).collection(usersCollection)

    collection.find({}).toArray(function(err, result) {
        if(err) {
            return next(err)
        }

        res.status(httpStatus.OK).json(result)
    })
}

function validateUsername(req, res, next) {
    const { error, value } = Joi.validate(req.body, userSchema)

    if(error) {
        error.statusCode = httpStatus.BAD_REQUEST
        // TODO: not exactly true, a username could be passed and still not match the schema
        error.message = 'No username was provided'
        return next(error)
    }

    req.username = value.username
    return next()
}

function createNewUser(req, res, next) {
    const username = req.username

    const db = mongoClient.db(dbName)
    const collection = db.collection(usersCollection)

    collection.findOne({ username }, function(err, result) {
        if(err) {
            return next(err)
        }

        if(result) {
            return res.status(httpStatus.BAD_REQUEST).json({ error: `User ${username} already exists` })
        }

        collection.insertOne({ username }, function(err, result) {
            if(err) {
                return next(err)
            }

            return res.status(httpStatus.OK).json(result.ops[0])
        })
    })
}

module.exports = {
    createNewUser,
    getAllUsers,
    validateUsername,
}
