const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const httpStatus = require('http-status')

const { createNewUser, getAllUsers, validateUsername } = require('./user')
const { addExercise, validateExercise } = require('./exercises')

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

app.get('/api/exercise/users', getAllUsers)
app.post('/api/exercise/new-user', validateUsername, createNewUser)
app.post('/api/exercise/add', validateExercise, addExercise)


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  //console.log(err)

  return res
    .status(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR)
    .json({ error: err.message || err })
})

app.on('ready', () => {
    const port = process.env.port || 3000
    app.listen(port, () => {
        console.log(`App listening on port ${port}`)
    })
})

module.exports = app;
