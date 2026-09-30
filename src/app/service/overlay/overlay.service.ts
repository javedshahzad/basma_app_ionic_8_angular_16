import { Injectable } from '@angular/core';
import { PopoverController, AlertController, ToastController, AlertButton } from '@ionic/angular';
import { LoaderComponent } from '../../components/loader/loader.component';

/** See createLoader()'s comment -- same reasoning applies to any overlay
 * (alert/toast included), so every presenter here calls this first. */
function BlurActiveElement(): void {
  const active = document.activeElement as HTMLElement | null;
  active?.blur();
}

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  private popOver: HTMLIonPopoverElement | null = null;

  constructor(
    private popoverController: PopoverController,
    private alertController: AlertController,
    private toastCtrl: ToastController
  ) { }

  async createLoader(backdropDismiss: boolean): Promise<HTMLIonPopoverElement> {
    // Ionic sets aria-hidden on the app's main content behind any
    // presented overlay. If the element that triggered this (typically
    // the submit button just clicked) still holds focus at that moment,
    // the browser correctly warns: a focused element can't be hidden from
    // assistive tech. Moving focus off it first (browser default target:
    // <body>) avoids that without changing anything visible.
    BlurActiveElement();
    const popover = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss,
      translucent: false,
      cssClass: 'loaderStyle'
    });
    await popover.present();
    return popover;
  }

  dismissLoader(popover: HTMLIonPopoverElement | null): void {
    if (popover) {
      popover.dismiss().catch(() => {});
    }
  }

  removeUrlFromString(inputString: string): string {
    if (!inputString) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return inputString.replace(urlRegex, '');
  }

  async presentAlert(header: string, message: string, buttons: (AlertButton | string)[] = ['Ok'], mode?: 'ios' | 'md', backdropDismiss: boolean = true): Promise<void> {
    BlurActiveElement();
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
    BlurActiveElement();
    const toast = await this.toastCtrl.create({
      message,
      position: 'bottom',
      cssClass: 'toastClass',
      duration: 3000
    });
    await toast.present();
  }

  /** Shows the single-instance loading popover, split out of DataService.
   * Dismisses any already-open one first so repeat calls can't stack loaders. */
  async show(): Promise<void> {
    if (this.popOver) {
      this.hide();
    }
    this.popOver = await this.createLoader(true);
  }

  hide(): void {
    if (this.popOver) {
      this.dismissLoader(this.popOver);
      this.popOver = null;
    }
  }

  async showLoading(): Promise<void> {
    await this.show();
  }

  /** Hide loading popup. */
  async hideLoading(): Promise<void> {
    setTimeout(() => {
      this.hide();
    }, 900);
  }

  /**
   * Wraps an API call with showLoading()/hideLoading(), guaranteeing
   * hideLoading() always fires even if the call throws — unlike the
   * hand-written show/hide pairs scattered across pages, a missed
   * catch branch here can't leave the spinner stuck. Success/error
   * handling stays with the caller; this only removes the mechanical
   * show/hide duplication.
   */
  async run<T>(work: () => Promise<T>): Promise<T> {
    this.showLoading();
    try {
      return await work();
    } finally {
      this.hideLoading();
    }
  }

  async errorAlert(error: string): Promise<void> {
    await this.presentAlert('تحذير', this.removeUrlFromString(error), ['Ok'], undefined, false);
  }

  async infoAlert(msg: string): Promise<void> {
    await this.presentAlert('معلومات', msg, ['Ok'], undefined, false);
  }
}
