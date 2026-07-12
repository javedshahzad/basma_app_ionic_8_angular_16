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
            loadChildren: () =>
             import('../classlist/classlist.module').then(m => m.ClasslistPageModule)
          }
        ]
      },
      {
        path: 'delaylist',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../delaylist/delaylist.module').then( m => m.DelaylistPageModule)
          }
        ]
      },
      {
        path: 'news',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../news/news.module').then(m => m.NewsPageModule)
          }
        ]
      },
      {
        path: 'messages',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../messages/messages.module').then(m => m.MessagesPageModule)
          }
        ]
      },
      {
        path: 'parentconnect',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../parentconnect/parentconnect.module').then( m => m.ParentconnectPageModule)
          }
        ]
      },
      {
        path: 'children',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../children/children.module').then( m => m.ChildrenPageModule)
          }
        ]
      },
      {
        path: 'private-message',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../private-message/private-message.module').then( m => m.PrivateMessagePageModule)
          }
        ]
      },
      {
        path: 'student-notes',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../student-notes/student-notes.module').then( m => m.StudentNotesPageModule)
          }
        ]
      },
      {
        path: 'elearning-schools',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../elearning-schools/elearning-schools.module').then( m => m.ElearningSchoolsPageModule)
          }
        ]
      },
      {
        path: 'warning-report',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../warning-report/warning-report.module').then( m => m.WarningReportPageModule)
          }
        ]
      },
      {
        path: 'follow-up-student',
        children: [
          {
            path: '',
            loadChildren: () =>
             import('../follow-up-student/follow-up-student.module').then( m => m.FollowUpStudentPageModule)
          }
        ]
      },
      {
        path: 'student-titles',
        children: [
          { path: '', loadChildren: () => import('../student-titles/student-titles.module').then(m => m.StudentTitlesPageModule) }
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
