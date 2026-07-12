import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationService { 
 // Readable Address
  address: string;

  // Location coordinates
  latitude: number;
  longitude: number;
  accuracy: number;

  //Geocoder configuration
  // geoencoderOptions: NativeGeocoderOptions = {
  //   useLocale: true,
  //   maxResults: 5
  // };
  constructor(
  //  private geolocation: Geolocation,
    // private nativeGeocoder: NativeGeocoder,
    // public androidPermissions:AndroidPermissions,
  ) {
  }

 checkGPSPermission(callback:any,e:any) {
    // this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION).then(
    //   result => {
    //     if (result.hasPermission) {
    //
    //       //If having permission show 'Turn On GPS' dialogue
    //       this.askToTurnOnGPS(res=>{
    //             callback(res);
    //           },err=>{
    //             e(err);
    //           });
    //     } else {
    //
    //       //If not having permission ask for permission
    //       this.requestGPSPermission(res=>{
    //             callback(res);
    //           },err=>{
    //             e(err);
    //           });
    //     }
    //   },
    //   err => {
    //     e(err);
    //     alert(err);
    //   }
    // );
  }
  requestGPSPermission(callback:any,e:any) {
    // this.locationAccuracy.canRequest().then((canRequest: boolean) => {
    //   if (canRequest) {
    //     console.log("4");
    //     this.getGeolocation(res=>{
    //       callback(res);
    //     },err=>{
    //       e(err);
    //     })
    //   } else {
    //     //Show 'GPS Permission Request' dialogue
    //     this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION)
    //       .then(
    //         () => {
    //           // call method to turn on GPS
    //           this.askToTurnOnGPS(res=>{
    //             callback(res);
    //           },err=>{
    //             e(err);
    //           });
    //         },
    //         error => {
    //           //Show alert if user click on 'No Thanks'
    //           e(error);
    //           alert('requestPermission Error requesting location permissions ' + error)
    //         }
    //       );
    //   }
    // });
  }
    askToTurnOnGPS(callback:any,e:any) {
    // this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
    //   () => {
    //     // When GPS Turned ON call method to get Accurate location coordinates
    //     this.getGeolocation(res=>{
    //       callback(res);
    //     },err=>{
    //       e(err);
    //     })
    //   },
    //   error =>{
    //     e(error);
    //     alert('Error requesting location permissions ' + JSON.stringify(error))
    //   }
    // );
  }
  //Get current coordinates of device
  getGeolocation(callback:any,e:any) {
    // this.geolocation.getCurrentPosition().then((resp) => {
    //   console.log(resp);
    //   this.latitude = resp.coords.latitude;
    //   this.longitude = resp.coords.longitude;
    //   this.accuracy = resp.coords.accuracy;
    //
    //   this.getGeoencoder(resp.coords.latitude, resp.coords.longitude,resp=>{
    //   	console.log(resp);
    //   	callback(resp);
    //   },error=>{
    //   	e(error);
    //   });
    //
    // }).catch((error) => {
    // 	e(error);
    //  // alert('Error getting location' + JSON.stringify(error));
    // });
  }

  //geocoder method to fetch address from coordinates passed as arguments
  getGeoencoder(latitude, longitude,callback:any,e:any) {
    // this.nativeGeocoder.reverseGeocode(latitude, longitude, this.geoencoderOptions)
    //   .then((result: NativeGeocoderResult[]) => {
    //     console.log(result);
    //     this.address = this.generateAddress(result[0]);
    //     callback(result[0]);
    //   })
    //   .catch((error: any) => {
    //   	e(error);
    //   //  alert('Error getting location' + JSON.stringify(error));
    //   });
  }

  //Return Comma saperated address
  generateAddress(addressObj) {
    let obj = [];
    let address = "";
    for (let key in addressObj) {
      obj.push(addressObj[key]);
    }
    obj.reverse();
    for (let val in obj) {
      if (obj[val].length)
        address += obj[val] + ', ';
    }
    return address.slice(0, -2);
  }

}
