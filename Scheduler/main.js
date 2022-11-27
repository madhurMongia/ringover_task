const amqp = require('amqplib');
const {Task} = require('./models');
const { Op } = require("sequelize");
const {TaskQueue, copy} = require('./queue');
const express = require('express');
const bodyParser = require('body-parser');
let channel ,connection;
let taskQueue = new TaskQueue();
let app = new express();
(async () => {
    connection =await amqp.connect("amqps://kxkbzbxw:M5Ls6rP789GztrF_WAM2FBZWTOP31jXk@puffin.rmq2.cloudamqp.com/kxkbzbxw")
    channel = await connection.createChannel();
    await channel.assertExchange('messageService', 'direct',{
        durable : false
    })
    channel.assertQueue('mailQueue', {
        durable : false
    })
    channel.assertQueue('smsQueue', {
        durable : false
    })
    channel.bindQueue('mailQueue', 'messageService', 'mail')
    channel.bindQueue('smsQueue', 'messageService', 'sms')
    channel.consume('mailQueue', async (msg) => {
        const taskInfo = JSON.parse(msg.content.toString());
        let dependencies = taskInfo['dependencies'];
        dependencies = await Task.findAll({
            where : {
                name : {
                    [Op.in] : dependencies,
                    [Op.not] : taskInfo.name
                }
            }
        })
        const [task,created] = await Task.findOrCreate({
            where : {
                name : taskInfo.name,
            },
            defaults: {type: 'mail',...taskInfo}
        });
        let queries = []
        dependencies.forEach((dep) => {
            queries.push(task.addDependancy(dep))
        })
        await Promise.all(queries)
        task.dependencies = dependencies;
        taskQueue.push(task)
       channel.ack(msg)
        if(taskQueue.size() > 5)
            executeJobs(taskQueue);
    })
    channel.consume('smsQueue', async (msg) => {
        const taskInfo = JSON.parse(msg.content.toString());
        let dependencies = taskInfo['dependencies'];
        dependencies = await Task.findAll({
            where : {
                name : {
                    [Op.in] : dependencies,
                    [Op.not] : taskInfo.name
                }
            },
            attributes: ['id']
        })
        const [task,created] = await Task.findOrCreate({
            where : {
                name : taskInfo.name,
            },
            defaults: {type: 'sms',...taskInfo}
        });
        let queries = []
        dependencies.forEach((dep) => {
            queries.push(task.addDependancy(dep))
        })
        await Promise.all(queries)
        task.dependencies = dependencies;
        taskQueue.push(task)
        channel.ack(msg)
        if(taskQueue.size() > 5)
            executeJobs(taskQueue);
    })
})()
app.use(bodyParser.json())
app.get('/schedule',(req,res) => {
    const clone = copy(taskQueue);
    const taskSchedule = [];
    while(clone.size()){
        taskSchedule.push(clone.nextTask().name);
    }
    res.send(taskSchedule);
} )
function executeJobs(taskQueue){
    while(taskQueue.size()){
        console.log(taskQueue.nextTask().name)
    }
}

app.listen(8000)