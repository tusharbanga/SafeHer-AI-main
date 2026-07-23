import express from "express";
import RideGuardian from "../models/RideGuardian.js";

const router = express.Router();


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


// START RIDE
router.post("/start", async (req, res) => {
  try {
    const {
      userId,
      pickup,
      destination,
      expectedRoutePolyline,
      etaMinutes,
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
        updatedAt: new Date(),
      },

      routeStartedAt: new Date(),

      deviationStatus: "safe",
    });


    res.json({
      success: true,
      ride,
    });


  } catch (error) {

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
});




// UPDATE LIVE LOCATION
router.post("/:rideId/location", async (req,res)=>{

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



// calculate deviation

let deviation = 0;


// compare current location with destination route points
if(
 ride.destination?.latitude &&
 ride.destination?.longitude
){

deviation = calculateDistance(
 latitude,
 longitude,
 ride.destination.latitude,
 ride.destination.longitude
);

}



let deviationStatus="safe";


if(deviation > 500){

deviationStatus="critical";

}
else if(deviation > 200){

deviationStatus="warning";

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


ride.deviationDistance=deviation;

ride.deviationStatus=deviationStatus;


await ride.save();



res.json({

success:true,

status:deviationStatus,

deviationDistance:deviation

});


}

catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

});





// GET LIVE RIDE STATUS

router.get("/:rideId/status",async(req,res)=>{

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


}

catch(error){

res.status(500).json({

success:false,

message:error.message

});

}


});





// COMPLETE RIDE

router.put("/:rideId/complete",async(req,res)=>{

try{


const ride =
await RideGuardian.findById(
req.params.rideId
);


ride.status="completed";

ride.destinationReached=true;

ride.completedAt=new Date();


await ride.save();


res.json({

success:true,

message:"Ride completed"

});


}

catch(error){

res.status(500).json({

success:false,

message:error.message

});

}


});



export default router;