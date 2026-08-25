import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [ 
    {
        path: 'classlist',
        children: [
          {
            path: '',
            loadComponent: () => import('../classlist/classlist.page').then(m => m.ClasslistPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'delaylist',
        children: [
          {
            path: '',
            loadComponent: () => import('../delaylist/delaylist.page').then(m => m.DelaylistPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'news',
        children: [
          {
            path: '',
            loadComponent: () => import('../news/news.page').then(m => m.NewsPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'messages',
        children: [
          {
            path: '',
            loadComponent: () => import('../messages/messages.page').then(m => m.MessagesPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'parentconnect',
        children: [
          {
            path: '',
            loadComponent: () => import('../parentconnect/parentconnect.page').then(m => m.ParentconnectPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'children',
        children: [
          {
            path: '',
            loadComponent: () => import('../children/children.page').then(m => m.ChildrenPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'private-message',
        children: [
          {
            path: '',
            loadComponent: () => import('../private-message/private-message.page').then(m => m.PrivateMessagePage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'student-notes',
        children: [
          {
            path: '',
            loadComponent: () => import('../student-notes/student-notes.page').then(m => m.StudentNotesPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'elearning-schools',
        children: [
          {
            path: '',
            loadComponent: () => import('../elearning-schools/elearning-schools.page').then(m => m.ElearningSchoolsPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'warning-report',
        children: [
          {
            path: '',
            loadComponent: () => import('../warning-report/warning-report.page').then(m => m.WarningReportPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'follow-up-student',
        children: [
          {
            path: '',
            loadComponent: () => import('../follow-up-student/follow-up-student.page').then(m => m.FollowUpStudentPage),
            data: { preload: true }
          }
        ]
      },
      {
        path: 'student-titles',
        children: [
          { path: '', loadComponent: () => import('../student-titles/student-titles.page').then(m => m.StudentTitlesPage), data: { preload: true } }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/classlist',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/classlist',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
