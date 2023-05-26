const mongoose = require('mongoose');
const nvd_schema = mongoose.Schema({ },{ strict : false } );
module.exports=mongoose.model("nvd_schema", nvd_schema);