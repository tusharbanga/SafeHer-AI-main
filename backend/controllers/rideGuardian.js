const RideGuardian = require("../models/RideGuardian");


// Calculate distance between two coordinates (meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};



// Start Ride Guardian
exports.startRide = async (req, res) => {
  try {

    const {
      userId,
      pickup,
      destination,
      expectedRoutePolyline,
      etaMinutes
    } = req.body;


    const ride = await RideGuardian.create({

      userId,

      pickup,

      destination,

      expectedRoutePolyline,

      etaMinutes,

      status: "started",

      currentLocation: {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        updatedAt: new Date()
      },

      routeStartedAt: new Date(),

      deviationStatus: "safe"

    });


    res.status(201).json({
      success:true,
      ride
    });


  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};





// Update Live Location
exports.updateRideLocation = async(req,res)=>{

try{


const {
latitude,
longitude
}=req.body;


const ride = await RideGuardian.findById(
req.params.rideId
);


if(!ride){

return res.status(404).json({
message:"Ride not found"
});

}



// Check deviation from destination
let distance = 0;


if(
ride.destination?.latitude &&
ride.destination?.longitude
){

distance = calculateDistance(

latitude,
longitude,

ride.destination.latitude,
ride.destination.longitude

);

}



let status="safe";


if(distance > 500){

status="critical";

}
else if(distance > 200){

status="warning";

}



ride.currentLocation={

latitude,
longitude,

updatedAt:new Date()

};



ride.locationHistory.push({

latitude,
longitude,

timestamp:new Date()

});



ride.deviationDistance=distance;

ride.deviationStatus=status;



await ride.save();



res.json({

success:true,

status,

distance

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};







// Get Current Ride Status

exports.getRideStatus = async(req,res)=>{

try{


const ride =
await RideGuardian.findById(
req.params.rideId
);



if(!ride){

return res.status(404).json({

message:"Ride not found"

});

}



res.json({

success:true,

ride

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};








// Complete Ride

exports.completeRide = async(req,res)=>{

try{


const ride =
await RideGuardian.findById(
req.params.rideId
);


if(!ride){

return res.status(404).json({
message:"Ride not found"
});

}



ride.status="completed";

ride.destinationReached=true;

ride.completedAt=new Date();


await ride.save();



res.json({

success:true,

message:"Ride completed"

});



}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};