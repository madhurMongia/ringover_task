const { Sequelize, DataTypes,Model } = require('sequelize');

const sequelize = new Sequelize('test','CsewVPEzGGpKQyB.root','12345678',{

    host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    port:4000,
    dialect: 'mysql',
    ssl:true,
    dialectOptions: {
        ssl: {minVersion: 'TLSv1.2', rejectUnauthorized: true}
    }
})

class Task extends Model {}

Task.init({
            id:{
                primaryKey:true,
                type: DataTypes.BIGINT,
                autoIncrement: true,
                nullable : false,
            },
            name:{
                type: DataTypes.STRING(255),
                unique : true,
                nullable: false,
            },
            priority : {
                type : DataTypes.INTEGER,
                nullable: false,
            },
            timestamp : {
                type : DataTypes.TIME,
                nullable: false,
            },
            subject : {
                type : DataTypes.TEXT,
            },
            message : {
                type : DataTypes.TEXT,
            },
            status : {
                type : DataTypes.ENUM("pending" , "completed"),
                defaultValue : "pending"
            },
            type : {
                type :  DataTypes.ENUM("sms" , "mail"),
            }
        },{
            sequelize
        });
Task.belongsToMany(Task, {as : "Dependancy" , through:"task_dependancy"});
(async () => {
    await sequelize.sync();
})()

module.exports = {
    Task
}