import { AnimationController } from '@ionic/angular';

export const modalEnterAnimation = (baseEl: HTMLElement) => {
  const animationCtrl = new AnimationController();

  const root = baseEl.shadowRoot?.querySelector('.modal-wrapper') || baseEl;
  const backdrop = baseEl.shadowRoot?.querySelector('.modal-backdrop') || baseEl.querySelector('.modal-backdrop');

  // Create the modal entrance animation
  const modalAnimation = animationCtrl.create()
    .addElement(root!)
    .duration(500)
    .easing('ease-in-out')
    .fromTo('transform', 'translateY(100%)', 'translateY(50%)') // Modal entrance
    .fromTo('opacity', 0, 1); // Modal fade in

  // Create the backdrop fade-in animation
  const backdropAnimation = animationCtrl.create()
    .addElement(backdrop!)
    .duration(500)
    .easing('ease-in-out')
    .fromTo('opacity', 0, 0.5); // Backdrop fade in

  // Combine both animations
  return animationCtrl.create().addAnimation([modalAnimation, backdropAnimation]);
};

export const modalLeaveAnimation = (baseEl: HTMLElement) => {
  const animationCtrl = new AnimationController();

  const root = baseEl.shadowRoot?.querySelector('.modal-wrapper') || baseEl;
  const backdrop = baseEl.shadowRoot?.querySelector('.modal-backdrop') || baseEl.querySelector('.modal-backdrop');

  // Create the modal exit animation
  const modalAnimation = animationCtrl.create()
    .addElement(root!)
    .duration(500)
    .easing('ease-in-out')
    .fromTo('transform', 'translateY(50%)', 'translateY(100%)') // Modal exit
    .fromTo('opacity', 1, 0); // Modal fade out

  // Create the backdrop fade-out animation
  const backdropAnimation = animationCtrl.create()
    .addElement(backdrop!)
    .duration(500)
    .easing('ease-in-out')
    .fromTo('opacity', 0.5, 0); // Backdrop fade out

  // Combine both animations
  return animationCtrl.create().addAnimation([modalAnimation, backdropAnimation]);
};
