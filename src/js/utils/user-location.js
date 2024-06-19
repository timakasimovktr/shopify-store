import moment from 'moment';

const IP_STACK_KEY = 'f0c55bf657fb24e41e25363a5a344214';

export const getUserLocation = async () => {
  let userLocationObj = JSON.parse(localStorage.getItem('LC-user-location'));
  const isValid = userLocationObj?.expiresAt && moment().diff(moment(userLocationObj.expiresAt)) < 0
  
  if(!userLocationObj?.value || !isValid){
    try {
      const ipRes = await (await getIp()).json();
      userLocationObj = {
        value: await (await getLocation(ipRes.ip)).json()
      }; 
      storeUserLocation(userLocationObj.value);
    } catch(ipError){
      console.error('Error getting client ip', ipError);
    }
  }

  return userLocationObj.value;
};

export const updateZipCode = async (newZipCode, updateIndicator=false) => {
  let currentLocation = await getUserLocation();
  currentLocation.zip = newZipCode;
  if (window.zipCodes.includes(newZipCode)) {
    localStorage.setItem("selected-delivery", newZipCode);
  }
  storeUserLocation(currentLocation);
};

const getIp = async () => {
  return await fetch('https://jsonip.com/');
};

const getLocation = async (ip) => {
  const url = `https://api.ipstack.com/${ip}?access_key=${IP_STACK_KEY}`;
  return await fetch(url);
};

const storeUserLocation = (location) => {
  localStorage.setItem('LC-user-location', JSON.stringify({
    value: location,
    expiresAt: moment().add(7, 'days').valueOf()
  }));
};

export const validateZip = async (zipCode) => {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const data = await response.json();

    if (!data?.places) {
      return 'invalid';
    }

    const isFlorida = data.places[0].state === 'Florida';
    const isDeliverableArea = window.zipCodes.includes(zipCode);
    if (!isFlorida || !isDeliverableArea) {
      return 'outside';
    }

    return 'valid';
  } catch (err) {
    console.log(`Something went wrong while validating zip: ${err}`);
  }
}

export const getRatesRequestBody = (zipCode, items) => {
  return {
    rate: {
      origin: {
        country: "US",
        postal_code: "33781",
        province: "FL",
        city: "Pinellas Park",
        name: null,
        address1: "5700 70th Avenue North",
        address2: null,
        address3: null,
        phone: "727-545-9555",
        fax: null,
        email: null,
        address_type: null,
        company_name: "Kane's Furniture"
      },
      destination: {
        postal_code: zipCode,
        province: "FL",
      },
      items,
      currency: "USD",
      locale: "en-US"
    }
  }
}