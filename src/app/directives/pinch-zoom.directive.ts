import { Directive, ElementRef, HostBinding, HostListener, Input, OnDestroy } from '@angular/core';

/**
 * Dependency-free pinch/drag/wheel zoom for a single element (typically an
 * <img>). Replaces @mtnair/ngx-pinch-zoom, which is abandoned upstream
 * (last published 2023-08-02, peer deps capped at Angular ^16) and was the
 * one dependency blocking `ng add @angular/ssr` from resolving at all.
 *
 * Pointer Events unify touch and mouse handling, so pinch (two touch
 * pointers), drag-to-pan (one pointer while zoomed in), and desktop
 * click-drag all share the same tracking logic.
 */
@Directive({
  selector: '[appPinchZoom]',
  standalone: true
})
export class PinchZoomDirective implements OnDestroy {
  @Input() maxZoom = 4;
  @Input() minZoom = 1;

  @HostBinding('style.transform')
  get transform(): string {
    return `translate(${this.x}px, ${this.y}px) scale(${this.scale})`;
  }

  @HostBinding('style.transition')
  get transition(): string {
    return this.isInteracting ? 'none' : 'transform 0.25s ease-out';
  }

  @HostBinding('style.touch-action')
  touchAction = 'none';

  @HostBinding('style.cursor')
  get cursor(): string {
    return this.scale > this.minZoom ? 'grab' : 'default';
  }

  private scale = 1;
  private x = 0;
  private y = 0;
  private isInteracting = false;

  private readonly pointers = new Map<number, PointerEvent>();
  private lastPinchDistance = 0;
  private lastPanPoint: { x: number; y: number } | null = null;
  private lastTapTime = 0;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    this.pointers.clear();
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    this.pointers.set(event.pointerId, event);
    this.isInteracting = true;

    if (this.pointers.size === 1) {
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      this.handleDoubleTap();
    } else if (this.pointers.size === 2) {
      this.lastPinchDistance = this.pinchDistance();
    }
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, event);

    if (this.pointers.size === 2) {
      this.handlePinch();
    } else if (this.pointers.size === 1 && this.scale > this.minZoom) {
      this.handlePan(event);
    }
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  @HostListener('pointerleave', ['$event'])
  onPointerEnd(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    this.lastPanPoint = null;
    if (this.pointers.size === 0) {
      this.isInteracting = false;
      this.settle();
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    this.applyZoom(this.scale + delta);
  }

  private handleDoubleTap(): void {
    const now = Date.now();
    if (now - this.lastTapTime < 300) {
      this.scale === this.minZoom ? this.applyZoom(this.maxZoom / 2) : this.reset();
      // Consumed this pair — a third rapid tap starts a fresh pair instead
      // of immediately toggling again off the second tap's timestamp.
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
    }
  }

  private handlePinch(): void {
    const distance = this.pinchDistance();
    if (this.lastPinchDistance > 0) {
      const factor = distance / this.lastPinchDistance;
      this.applyZoom(this.scale * factor);
    }
    this.lastPinchDistance = distance;
  }

  private handlePan(event: PointerEvent): void {
    if (!this.lastPanPoint) return;
    this.x += event.clientX - this.lastPanPoint.x;
    this.y += event.clientY - this.lastPanPoint.y;
    this.lastPanPoint = { x: event.clientX, y: event.clientY };
    this.clampPan();
  }

  private applyZoom(nextScale: number): void {
    const clamped = Math.min(this.maxZoom, Math.max(this.minZoom, nextScale));
    if (clamped === this.minZoom) {
      this.x = 0;
      this.y = 0;
    }
    this.scale = clamped;
    this.clampPan();
  }

  private clampPan(): void {
    if (this.scale <= this.minZoom) {
      this.x = 0;
      this.y = 0;
      return;
    }
    const rect = this.el.nativeElement.getBoundingClientRect();
    const maxOffsetX = (rect.width * (this.scale - 1)) / 2;
    const maxOffsetY = (rect.height * (this.scale - 1)) / 2;
    this.x = Math.min(maxOffsetX, Math.max(-maxOffsetX, this.x));
    this.y = Math.min(maxOffsetY, Math.max(-maxOffsetY, this.y));
  }

  private settle(): void {
    if (this.scale < this.minZoom + 0.05) {
      this.reset();
    }
  }

  private reset(): void {
    this.scale = this.minZoom;
    this.x = 0;
    this.y = 0;
  }

  private pinchDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }
}
