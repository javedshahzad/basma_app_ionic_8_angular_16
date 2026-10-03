import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { DatePipe } from '@angular/common';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { AllApplicationListPage } from './all-application-list.page';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AllApplicationListPage', () => {
  let component: AllApplicationListPage;
  let fixture: ComponentFixture<AllApplicationListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule, AllApplicationListPage],
      providers: [
        DatePipe,
        {
          provide: IonicStorage,
          useValue: {
            create: () =>
              Promise.resolve({
                get: () => Promise.resolve(null),
                set: () => Promise.resolve(),
                remove: () => Promise.resolve(),
                clear: () => Promise.resolve()
              })
          }
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AllApplicationListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function makeApplications(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      application_status: '0',
      studentObj: { name: `Student ${i}` },
      courseObj: { name: `Course ${i}` }
    }));
  }

  it('only renders the first page of applications, not the full list', () => {
    (component as any).AllAvailableApplications = makeApplications(45);
    (component as any).resetVisibleApplications();
    expect(component.visibleApplications.length).toBe(20);
    expect(component.AllAvailableApplications.length).toBe(45);
  });

  it('loadMoreApplications() grows the visible page without truncating the source data', done => {
    (component as any).AllAvailableApplications = makeApplications(45);
    (component as any).resetVisibleApplications();

    const infiniteScrollStub = { target: { complete: () => {} } };
    component.loadMoreApplications(infiniteScrollStub);

    setTimeout(() => {
      expect(component.visibleApplications.length).toBe(40);
      expect(component.AllAvailableApplications.length).toBe(45);
      done();
    }, 350);
  });

  it('a short list is fully visible after one page', () => {
    (component as any).AllAvailableApplications = makeApplications(5);
    (component as any).resetVisibleApplications();
    expect(component.visibleApplications.length).toBe(5);
  });
});
