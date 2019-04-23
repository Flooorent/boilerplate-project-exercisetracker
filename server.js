const {client: mongoClient} = require('./config/mongo')
const app = require('./app')

mongoClient.connect(function(err) {
  if(err) {
    throw new Error(err)
  }

  console.log('Connected to mongo')
  app.emit('ready')
})
