const mongoose = require('mongoose');

const schedule_schema = mongoose.Schema({ },{ strict : false } )

module.exports=mongoose.model("schedule_schema",schedule_schema);