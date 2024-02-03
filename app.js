const express = require('express');
const morgan = require('morgan')
const app = express();
const fs = require('fs')
const axios = require('axios');
const getGeocode = async (address) => {
    console.log(address)
    try {
        const apiKey = '2bdd3ce549d2462694be1b149ccbfe4c';

        const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: {
                q: address,
                key: apiKey,
            },
        });
        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0].geometry;
            const { lat, lng } = result;
            console.log(`Geocode for ${address}:`);
            console.log(`Latitude: ${lat}`);
            console.log(`Longitude: ${lng}`);
            return { lat: lat, lon: lng }

        } else {
            console.log(`Geocode not found for ${address}`);
        }
    } catch (error) {
        throw new Error(`Error during geocoding for "${address}": ${error.message}`);
    }
};

const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth radius in kilometers
    const dLat = degToRad(coord2.lat - coord1.lat);
    const dLon = degToRad(coord2.lon - coord1.lon);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degToRad(coord1.lat)) * Math.cos(degToRad(coord2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
};

const degToRad = (degrees) => {
    return degrees * (Math.PI / 180);
};
const calculateBikeRoute = async (apiKey, start, end) => {
    console.log(`${start.latitude},${start.longitude} | ${end.latitude},${end.longitude}`)
    try {
        const pointsParameter = `${start.latitude},${start.longitude}|${end.latitude},${end.longitude}`;
        const response = await axios.get('https://graphhopper.com/api/1/route', {
            params: {
                key: apiKey,
                vehicle: 'car',
                points: pointsParameter,
                instructions: true,
                point_hint: true,
            },
        });

        const route = response.data.paths[0];
        fs.writeFileSync('data.json',route)
        console.log('Total Distance:', route.distance);
        console.log('Total Time:', route.time / 1000 + ' seconds'); // Convert milliseconds to seconds

        // Extract and print turn-by-turn instructions
        route.instructions.forEach(instruction => {
            console.log(instruction.text);
        });
        return route;
    } catch (error) {
        console.log(error)
        console.error('Error calculating bike route:', error.message);
    }
};

const main = async (req, res) => {
    const userAddress = await getGeocode(req?.body?.userAddress?.address);
    const sellerAddress = await getGeocode(req?.body?.sellerAddress?.address);
    console.log(userAddress, sellerAddress)
    const distance = calculateDistance(userAddress, sellerAddress);
    const startPoint = { latitude: 52.5200, longitude: 13.4050 }; // Replace with actual coordinates
    const endPoint = { latitude: 51.5099, longitude: -0.1337 }; // Replace with actual coordinates
    const apiKey = '90730ef8-1f30-4a6d-831c-6c45a1b65a4c'
    const route = await calculateBikeRoute(apiKey, startPoint, endPoint);
    console.log(`Distance between Pune Station and Phoenix Mall: ${distance.toFixed(2)} km`);
    return {"distance":`Distance between Pune Station and Phoenix Mall: ${distance.toFixed(2)} km`,"route":route}
};


app.use(express.json());

app.use(morgan('dev'));

app.use(checkSanityOfAddress);


function checkSanityOfAddress(req, res, next) {
    const userAddress = req?.body?.userAddress;
    const sellerAddress = req?.body?.sellerAddress;

    if (userAddress && sellerAddress) {
        req.body.userAddress.address = Object.values(userAddress).join(' ');
        req.body.sellerAddress.address = Object.values(userAddress).join(' ');
        next();
    }
    else {
        res.status(400).json({
            status: "error",
            message: "The address for user and seller does not include all properties such as address, city, country"
        })
    }
}
app.get('/getdistance', async (req, res) => {
    let msg = await main(req, res).catch((error) => console.error(error))
    res.status(200).json({ status: "Success", message: msg });
})
app.listen(3000, () => {
    console.log(`Server started on 3000`)
});