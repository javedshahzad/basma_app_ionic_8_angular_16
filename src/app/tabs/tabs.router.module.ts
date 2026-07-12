import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '../core/auth/auth-guard.service';

const routes: Routes = [{
  path: 'tabs',
  component: TabsPage,
  children: [
  {
    path: 'tab1',
    children: [{
      path: '',
      loadChildren: () => import('../pages/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    }]
  }, 
  {
    path: 'tab2',
    children: [{
      path: '',
      loadChildren: () => import('../pages/inspection/inspection.module').then(m => m.InspectionPageModule),
    }]
  }, 
  {
    path: 'tab3',
    children: [{
      path: '',
      loadChildren: () => import('../pages/setting/setting.module').then(m => m.SettingPageModule),
    }]
  }, 
  {
    path: 'view-tasks',
    children:[{
      path:"",
      loadChildren: () => import('../pages/tasks-management/view-tasks/view-tasks.module').then( m => m.ViewTasksPageModule)
    }]
  },
  // 🟢 1. إضافة مسار الطالب الجديد لضمان نجاح التوجيه الذي قمنا ببرمجته سابقاً
  {
    path: 'student-titles',
    children: [{
      path: '',
      // ⚠️ تنبيه: تأكد أن هذا المسار يطابق موقع مجلد صفحة student-titles الفعلي في مشروعك
      loadChildren: () => import('../student-titles/student-titles.module').then(m => m.StudentTitlesPageModule)
    }]
  },
  // 🟢 2. إضافة مسار ولي الأمر لضمان نجاح التوجيه الخاص به أيضاً
  {
    path: 'children',
    children: [{
      path: '',
      // ⚠️ تنبيه: تأكد أن هذا المسار يطابق موقع مجلد صفحة children الفعلي في مشروعك
      loadChildren: () => import('../children/children.module').then(m => m.ChildrenPageModule)
    }]
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full'
  }]
}, {
  path: '',
  redirectTo: '/tabs/tab1',
  pathMatch: 'full',
 // canActivate: [AuthGuard]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule { }