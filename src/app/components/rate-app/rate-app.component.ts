import { Component, OnInit, Input, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rate-app',
  templateUrl: './rate-app.component.html',
  styleUrls: ['./rate-app.component.scss'],
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RateAppComponent implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  @Input() lang: any;
  @Input() data: any;
  noteDescription: any;
  noteMessage: string = '';
  providedStars: any = 1;
  showNoteModal: boolean = false;
  selections: any = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
  aggStars: any = ['#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
  ratingStars: number = 1;
  constructor(public popoverController: PopoverController) {}

  ngOnInit() {
    console.log(this.lang, this.data);
    console.log('reate app data::::', this.data);
    this.noteMessage = this.data?.note;
    this.providedStars = this.data?.rating;
    console.log('this.noteMessage:::', this.noteMessage);

    this.selections = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
    for (let i = 0; i < (this.data?.rating || 0); i++) {
      this.selections[i] = '#04855f';
    }

    /*  setTimeout(()=>{
         const inputElement = document.getElementById("textArea") as HTMLInputElement;
         inputElement.value=this.data.note;
         if(this.data.rating=='1'){
          let ch:any=document.getElementById('rating-1');
          console.log(ch);
          setTimeout(()=>{
            ch.checked=true;
          },300)
         }
         if(this.data.rating=='2'){
          let ch:any=document.getElementById('rating-2');
          console.log(ch);
          setTimeout(()=>{
            ch.checked=true;
          },300)
         }
         if(this.data.rating=='3'){
          let ch:any=document.getElementById('rating-3');
          console.log(ch);
          setTimeout(()=>{
            ch.checked=true;
          },300)
         }
         if(this.data.rating=='4'){
          let ch:any=document.getElementById('rating-4');
          console.log(ch);
          setTimeout(()=>{
            ch.checked=true;
          },300)
         }
         if(this.data.rating=='5'){
          let ch:any=document.getElementById('rating-5');
          console.log(ch);
          setTimeout(()=>{
            ch.checked=true;
          },300)
         }
     },500)
  */
  }

  closePopup(data: any) {
    this.popoverController.dismiss(data);
  }
  /* for rating */
  rate() {
    const inputElement = document.getElementById('textArea') as HTMLInputElement;
    let i = inputElement.value;
    let stars: any;
    if (this.providedStars) {
      stars = this.providedStars;
    } else {
      stars = this.data?.rating;
    }
    let data = {
      stars: stars,
      description: i
    };
    // console.log(data);
    this.closePopup(data);
  }

  provideRating(stars: any, eve: any) {
    console.log(eve);
    this.providedStars = stars;
  }
  getSelectedStars() {
    return new Array(5);
  }

  selectStarsForRating(index: number) {
    this.providedStars = index + 1;
    this.selections = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
    for (let i = 0; i <= index; i++) {
      this.selections[i] = '#04855f';
    }
    console.log('stars for rating', this.providedStars);
  }
  /* modal open for rating having 5 stars*/
  openNoteModal() {
    this.ratingStars = 1;
    this.selections = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
    this.showNoteModal = true;
  }
  hideNoteModal() {
    this.showNoteModal = false;
  }
}
