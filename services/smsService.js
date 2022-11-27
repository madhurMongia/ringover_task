const express = require('express')
const { body , validationResult} = require('express-validator')
const bodyParser = require('body-parser')
const amqp = require('amqplib');

const app = express()
app.use(bodyParser.json())
let channel,connection;
async function amqpSetup(){
        connection =await amqp.connect("amqps://kxkbzbxw:M5Ls6rP789GztrF_WAM2FBZWTOP31jXk@puffin.rmq2.cloudamqp.com/kxkbzbxw")
        channel = await connection.createChannel();
        await channel.assertExchange('messageService', 'direct',{
            durable : false
        })
        channel.assertQueue('smsQueue', {
            durable : false
        })
        channel.bindQueue('smsQueue', 'messageService', 'sms')
}
amqpSetup()
app.post('/smsService/add_task/',body('dependencies').custom(checkArray),
body('priority').isInt().exists(),
body('name').notEmpty().exists(),
body('timestamp').isISO8601().toDate()
.withMessage("Invalid timestamp received"),
body('subject').exists().isString(),
body('message').exists().isString(),
body('receiver').isLength(10).exists().isNumeric(),
(req,res) => {
    const validationError = validationResult(req)
    if(validationError.errors.length){
        res.status(400).json({error : validationError.array()})
    }
    else{
    channel.publish('messageService','sms', Buffer.from(JSON.stringify(req.body)))
    res.send(req.body)
    }
})


app.listen(5000,() => {
    console.log("sms server up!")
})

function checkArray(value){
    return Array.isArray(value)
}
