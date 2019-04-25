const Joi = require('joi')

const userSchema = Joi.object().keys({
    username: Joi.string().regex(/^[a-zA-Z0-9_-]+$/).min(1).required()
})

module.exports = {
    userSchema,
}
