import { Directive, HostListener, Output, EventEmitter, Input } from '@angular/core';

export type ScrollEvent = {
  originalEvent: Event,
  isReachingBottom: boolean,
  isWindowEvent: boolean,
  scrollLeft: number,
  scrollTop: number
};

declare const window: Window;

@Directive({
  selector: '[detect-scroll]'
})
export class ScrollDirective {
  @Output() public onScroll = new EventEmitter<ScrollEvent>();
  @Input() public bottomOffset: number = 100;

  constructor() { }

  // handle host scroll
  @HostListener('scroll', ['$event']) public scrolled($event: Event) {
    this.elementScrollEvent($event);
  }

  // handle window scroll
  @HostListener('window:scroll', ['$event']) public windowScrolled($event: Event) {
    this.windowScrollEvent($event);
  }

  protected windowScrollEvent($event: Event) {
    const target = <Document>$event.target;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    const isReachingBottom = ( target.body.offsetHeight - (window.innerHeight + scrollTop) ) < this.bottomOffset;
    const emitValue: ScrollEvent = {isReachingBottom, originalEvent: $event, isWindowEvent: true, scrollTop: scrollTop, scrollLeft: scrollLeft};
    this.onScroll.emit(emitValue);
  }

  protected elementScrollEvent($event: Event) {
    const target = <HTMLElement>$event.target;
    const scrollPosition = target.scrollHeight - target.scrollTop;
    const offsetHeight = target.offsetHeight;
    const isReachingBottom = (scrollPosition - offsetHeight) < this.bottomOffset;
    const emitValue: ScrollEvent = {isReachingBottom, originalEvent: $event, isWindowEvent: false, scrollLeft: target.scrollLeft, scrollTop: target.scrollTop};
   
    console.log("scrollPosition="+ scrollPosition+" target.scrollLeft="+target.scrollLeft+" target.scrollTop="+target.scrollTop)
    this.onScroll.emit(emitValue);
  }

}