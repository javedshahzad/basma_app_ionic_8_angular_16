import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { SelectMessageUserPage } from './select-message-user.page';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SelectMessageUserPage', () => {
  let component: SelectMessageUserPage;
  let fixture: ComponentFixture<SelectMessageUserPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule, SelectMessageUserPage],
    providers: [
        { provide: AppRate, useValue: {} },
        {
            provide: IonicStorage,
            useValue: {
                create: () => Promise.resolve({
                    get: () => Promise.resolve(null),
                    set: () => Promise.resolve(),
                    remove: () => Promise.resolve(),
                    clear: () => Promise.resolve()
                })
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();

    fixture = TestBed.createComponent(SelectMessageUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
