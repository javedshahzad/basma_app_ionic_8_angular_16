import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { EditStudentProfileComponent } from './edit-student-profile.component';

describe('EditStudentProfileComponent', () => {
  let component: EditStudentProfileComponent;
  let fixture: ComponentFixture<EditStudentProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ],
      imports: [EditStudentProfileComponent, IonicModule.forRoot(), HttpClientTestingModule, TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: Network, useValue: { onDisconnect: () => NEVER, onConnect: () => NEVER, type: 'wifi', Connection: { UNKNOWN: 'unknown', NONE: 'none' } } },
        { provide: Device, useValue: { uuid: 'test-uuid', platform: 'browser' } },
        { provide: SQLite, useValue: {} },
        { provide: AppRate, useValue: {} },
        { provide: IonicStorage, useValue: { create: () => Promise.resolve({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditStudentProfileComponent);
    component = fixture.componentInstance;
    component.student = { name: 'Test Student', cid: 1 };
    component.classes = [];
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
