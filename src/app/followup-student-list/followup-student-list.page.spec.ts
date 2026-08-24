import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { FollowupStudentListPage } from './followup-student-list.page';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('FollowupStudentListPage', () => {
  let component: FollowupStudentListPage;
  let fixture: ComponentFixture<FollowupStudentListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule, FollowupStudentListPage],
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

    fixture = TestBed.createComponent(FollowupStudentListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function makeStudents(count: number) {
    return Array.from({ length: count }, (_, i) => ({ sid: i, name: `Student ${i}`, sheet: [] }));
  }

  it('only renders the first page of students, not the full list', () => {
    (component as any).attendanceResponse = { students: makeStudents(45) };
    (component as any).resetVisibleStudents();
    expect(component.visibleStudents.length).toBe(20);
    expect(component.attendanceResponse.students.length).toBe(45);
  });

  it('loadMoreStudents() grows the visible page without truncating the source data', done => {
    (component as any).attendanceResponse = { students: makeStudents(45) };
    (component as any).resetVisibleStudents();

    const infiniteScrollStub = { target: { complete: () => {} } };
    component.loadMoreStudents(infiniteScrollStub);

    setTimeout(() => {
      expect(component.visibleStudents.length).toBe(40);
      expect(component.attendanceResponse.students.length).toBe(45);
      done();
    }, 350);
  });

  it('a short list is fully visible after one page', () => {
    (component as any).attendanceResponse = { students: makeStudents(5) };
    (component as any).resetVisibleStudents();
    expect(component.visibleStudents.length).toBe(5);
  });
});
