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
            loadComponent: () => import('../classlist/classlist.page').then(m => m.ClasslistPage)
          }
        ]
      },
      {
        path: 'delaylist',
        children: [
          {
            path: '',
            loadComponent: () => import('../delaylist/delaylist.page').then(m => m.DelaylistPage)
          }
        ]
      },
      {
        path: 'news',
        children: [
          {
            path: '',
            loadComponent: () => import('../news/news.page').then(m => m.NewsPage)
          }
        ]
      },
      {
        path: 'messages',
        children: [
          {
            path: '',
            loadComponent: () => import('../messages/messages.page').then(m => m.MessagesPage)
          }
        ]
      },
      {
        path: 'parentconnect',
        children: [
          {
            path: '',
            loadComponent: () => import('../parentconnect/parentconnect.page').then(m => m.ParentconnectPage)
          }
        ]
      },
      {
        path: 'children',
        children: [
          {
            path: '',
            loadComponent: () => import('../children/children.page').then(m => m.ChildrenPage)
          }
        ]
      },
      {
        path: 'private-message',
        children: [
          {
            path: '',
            loadComponent: () => import('../private-message/private-message.page').then(m => m.PrivateMessagePage)
          }
        ]
      },
      {
        path: 'student-notes',
        children: [
          {
            path: '',
            loadComponent: () => import('../student-notes/student-notes.page').then(m => m.StudentNotesPage)
          }
        ]
      },
      {
        path: 'elearning-schools',
        children: [
          {
            path: '',
            loadComponent: () => import('../elearning-schools/elearning-schools.page').then(m => m.ElearningSchoolsPage)
          }
        ]
      },
      {
        path: 'warning-report',
        children: [
          {
            path: '',
            loadComponent: () => import('../warning-report/warning-report.page').then(m => m.WarningReportPage)
          }
        ]
      },
      {
        path: 'follow-up-student',
        children: [
          {
            path: '',
            loadComponent: () => import('../follow-up-student/follow-up-student.page').then(m => m.FollowUpStudentPage)
          }
        ]
      },
      {
        path: 'student-titles',
        children: [
          { path: '', loadComponent: () => import('../student-titles/student-titles.page').then(m => m.StudentTitlesPage) }
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
