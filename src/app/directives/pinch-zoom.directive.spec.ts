import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PinchZoomDirective } from './pinch-zoom.directive';

@Component({
  template: `<img appPinchZoom [maxZoom]="4" [minZoom]="1" style="width:200px;height:200px;" />`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PinchZoomDirective]
})
class HostComponent {}

function translateX(transform: string): number {
  return Number(transform.match(/translate\(([-\d.]+)px/)?.[1] ?? NaN);
}

function pointerEvent(type: string, opts: { id?: number; x: number; y: number }): PointerEvent {
  return new PointerEvent(type, {
    pointerId: opts.id ?? 1,
    clientX: opts.x,
    clientY: opts.y,
    bubbles: true,
    cancelable: true
  });
}

describe('PinchZoomDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let img: HTMLImageElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    img = fixture.nativeElement.querySelector('img');
    // JSDOM/Karma's Chrome headless environment measures a 0x0 box for an
    // unattached-to-viewport element; stub a real rect so pan-clamping math
    // (which divides by rect width/height) has something real to work with.
    spyOn(img, 'getBoundingClientRect').and.returnValue({
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);
  });

  // @HostBinding only writes to the real DOM during Angular's own
  // change-detection pass, not synchronously when dispatchEvent() fires a
  // @HostListener — so every read needs a detectChanges() first.
  function transform(): string {
    fixture.detectChanges();
    return img.style.transform;
  }

  it('starts at scale(1) with no offset', () => {
    expect(transform()).toBe('translate(0px, 0px) scale(1)');
  });

  it('double-tap (two quick pointerdowns) zooms in, then resets on a third', () => {
    img.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 100 }));

    expect(transform()).toContain('scale(2)');

    img.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 100 }));

    expect(transform()).toBe('translate(0px, 0px) scale(1)');
  });

  it('two-finger pinch increases scale proportionally to finger-distance growth', () => {
    img.dispatchEvent(pointerEvent('pointerdown', { id: 1, x: 90, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerdown', { id: 2, x: 110, y: 100 })); // distance 20

    img.dispatchEvent(pointerEvent('pointermove', { id: 1, x: 70, y: 100 }));
    img.dispatchEvent(pointerEvent('pointermove', { id: 2, x: 130, y: 100 })); // distance 60 -> 3x factor

    expect(transform()).toContain('scale(3)');
  });

  it('pinching below 1x clamps to scale(1), not below', () => {
    img.dispatchEvent(pointerEvent('pointerdown', { id: 1, x: 90, y: 100 }));
    img.dispatchEvent(pointerEvent('pointerdown', { id: 2, x: 110, y: 100 })); // distance 20

    img.dispatchEvent(pointerEvent('pointermove', { id: 1, x: 99, y: 100 }));
    img.dispatchEvent(pointerEvent('pointermove', { id: 2, x: 101, y: 100 })); // distance 2 -> would be 0.1x

    expect(transform()).toBe('translate(0px, 0px) scale(1)');
  });

  it('wheel-up zooms in; repeated wheel-up clamps at maxZoom', () => {
    for (let i = 0; i < 30; i++) {
      img.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
    }
    expect(transform()).toContain('scale(4)');
  });

  it('dragging while zoomed in pans, clamped to the bounds allowed at the current zoom level', () => {
    // Zoom in well past the point where a 30px pan would need clamping,
    // so this test also exercises that the pan bound scales with zoom
    // (maxOffset = elementSize * (scale - 1) / 2 — see clampPan()).
    for (let i = 0; i < 4; i++) {
      img.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
    }
    const scaleAfterZoom = transform().match(/scale\(([\d.]+)\)/)?.[1];
    const maxOffsetX = (200 * (Number(scaleAfterZoom) - 1)) / 2;
    expect(maxOffsetX).toBeGreaterThan(30); // sanity: this drag should NOT need clamping

    img.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointermove', { x: 130, y: 100 }));

    expect(translateX(transform())).toBeCloseTo(30, 5);
  });

  it('clamps panning to the image bounds instead of letting it drift off-screen', () => {
    img.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true })); // scale ~1.15, maxOffsetX ~15

    img.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
    img.dispatchEvent(pointerEvent('pointermove', { x: 500, y: 100 })); // attempt a 400px drag

    const offset = translateX(transform());
    expect(offset).toBeLessThan(20); // clamped, nowhere near the attempted 400px
    expect(offset).toBeCloseTo(15, 5);
  });

  it('does not throw on pointerup for a pointer that was never tracked (defensive against stray events)', () => {
    expect(() => img.dispatchEvent(pointerEvent('pointerup', { id: 99, x: 0, y: 0 }))).not.toThrow();
  });
});
