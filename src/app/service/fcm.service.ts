import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  Capacitor
} from '@capacitor/core';
import { Router } from '@angular/router';

import { ActionPerformed, PushNotificationSchema, PushNotifications, Token } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Platform } from '@ionic/angular';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  FcmToken: string;
  userDetails: any;
public getPlan: Subject<boolean> = new Subject();
  constructor(private router: Router,private platform:Platform,private storageSr: StorageService) { }

  initPush() {
    if (Capacitor.getPlatform() !== 'web') {
      this.platform.ready().then(()=>{
        this.registerPush();
      })
   
    }
  }

  private registerPush() {
    PushNotifications.requestPermissions().then((permission) => {
      if (permission.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
        PushNotifications.addListener(
          'registration',
          (token: Token) => {
            console.log('My token: ' + JSON.stringify(token));
            this.FcmToken = token.value;
            localStorage.setItem("FcmToken",this.FcmToken);
            console.log("Token= " ,this.FcmToken);
            if(this.FcmToken){
              let opt = { topic: 'all' };
              FCM.subscribeTo(opt).then((subs)=>{
                console.log(subs)
              }).catch(error=>{
                console.log(error)
              })
            }
          }
        );
    
        PushNotifications.addListener('registrationError', (error: any) => {
          console.log('FCM registration Error: ' + JSON.stringify(error));
        });
    
        PushNotifications.addListener(
          'pushNotificationReceived',
          async (notificationReceived: PushNotificationSchema) => {
            console.log('Push received: ' + JSON.stringify(notificationReceived));
          }
        );
    
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          async (notification: ActionPerformed) => {
            const data = notification.notification.data;
            console.log(data);
            this.userDetails = await this.storageSr.get("userloggedin");
            if(this.userDetails.details.user_type == '4' || this.userDetails.details.user_type == '8')
            if(data.type == "PrivateMessage"){
              setTimeout(() => {
                this.router.navigate(['tabs/private-message']);
              }, 2500);
            }
            if(data.type == 'ClassNotes'){
              if(this.userDetails.details.user_type == '4' || this.userDetails.details.user_type == '8')
              {
                setTimeout(() => {
                  this.router.navigate(['/tabs/student-notes']);
                }, 2500);
              }
            }
            if(data.type == 'FromStudentParent'){
              if(this.userDetails.details.user_type == '4' || this.userDetails.details.user_type == '8')
              {
                setTimeout(() => {
                  this.router.navigate(['/parentconnect']);
                }, 2500);
              }
            }
            if(data.type == 'FromAdminToParentStudent'){
              if(this.userDetails.details.user_type == '4' || this.userDetails.details.user_type == '8')
              {
                setTimeout(() => {
                  this.router.navigate(['/tabs/parentconnect']);
                }, 2500);
              }
            };
            console.log('Action performed: ' + JSON.stringify(notification.notification));
            console.log(notification);
          }
        );
      } else {
        // No permission for push granted
      }
    }).catch(error=>{
      console.log("Permission error",error)
    });

   
  }
}