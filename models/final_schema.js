const mongoose = require('mongoose');
const final_schema= mongoose.Schema({ },{ strict : false } );
module.exports=mongoose.model("final_schema",final_schema);