import { Injectable } from '@angular/core';
import { PopoverController, AlertController, ToastController } from '@ionic/angular';
import { LoaderComponent } from '../../components/loader/loader.component';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  constructor(
    private popoverController: PopoverController,
    private alertController: AlertController,
    private toastCtrl: ToastController
  ) { }

  async createLoader(backdropDismiss: boolean): Promise<any> {
    const popover = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss,
      translucent: false,
      cssClass: 'loaderStyle'
    });
    await popover.present();
    return popover;
  }

  dismissLoader(popover: any): void {
    if (popover) {
      popover.dismiss().catch(() => {});
    }
  }

  removeUrlFromString(inputString: string): string {
    if (!inputString) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return inputString.replace(urlRegex, '');
  }

  async presentAlert(header: string, message: string, buttons: any[] = ['Ok'], mode?: 'ios' | 'md', backdropDismiss: boolean = true): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      backdropDismiss,
      buttons,
      ...(mode ? { mode } : {})
    });
    await alert.present();
  }

  async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      position: 'bottom',
      cssClass: 'toastClass',
      duration: 3000
    });
    await toast.present();
  }
}
