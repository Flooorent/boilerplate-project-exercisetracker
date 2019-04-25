const MongoClient = require('mongodb').MongoClient

const url = 'mongodb://127.0.0.1'
const dbName = {
    'development': 'fcc-exercise-tracker',
    'test': 'fcc-exercise-tracker-test',
}

const usersCollection = 'users'
const logsCollection = 'logs'

const client = new MongoClient(url)

const env = process.env.NODE_ENV || 'development'

module.exports = {
    client,
    dbName: dbName[env],
    usersCollection,
    logsCollection,
}
