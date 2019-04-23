const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

const {client: mongoClient, dbName, collection: mongoCollection} = require('./config/mongo')

//const mongoose = require('mongoose')
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


/*


I can get an array of all users by getting api/exercise/users with the same info as when creating a user.
I can add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add. If no date supplied it will use current date. Returned will the the user object with also with the exercise fields added.
I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id). Return will be the user object with added array log and count (total exercise count).
I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)

*/


app.post('/api/exercise/new-user', function(req, res, next) {
    const username = req.body.username

    if(!username) {
        const err = new Error('username was not specified')
        return next(err)
    }

    const db = mongoClient.db(dbName)
    const collection = db.collection(mongoCollection)

    collection.findOne({username}, function(err, result) {
        if(err) {
            return next(err)
        }

        // TODO: check that it is undefined or null when there is nobody with that username in the database
        if(result) {
            return res.json({error: 'This username already exists'})
        }

        collection.insertOne({username}, function(err, result) {
            if(err) {
                return next(err)
            }

            // TODO: check that we correctly return the right json object
            return res.json(result)
        })
    })
})



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

app.on('ready', () => {
    const port = process.env.port || 3000
    app.listen(port, () => {
        console.log(`App listening on port ${port}`)
    })
})

module.exports = app;
