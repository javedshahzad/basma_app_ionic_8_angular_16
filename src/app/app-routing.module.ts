import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { RoleGuard } from './guard/role.guard';
import { UserType } from './constants/user-type';
import { SelectivePreloadingStrategyService } from './service/selective-preloading-strategy/selective-preloading-strategy.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule) , canActivate: [AuthGuard]
  },
  {
    path: 'register-teacher',
    loadComponent: () => import('./register-teacher/register-teacher.page').then(m => m.RegisterTeacherPage)
  },
  {
    path: 'school-registration',
    loadComponent: () => import('./school-registration/school-registration.page').then(m => m.SchoolRegistrationPage)
  },
  {
    path: 'about-us',
    loadComponent: () => import('./about-us/about-us.page').then(m => m.AboutUsPage)
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./contact-us/contact-us.page').then(m => m.ContactUsPage)
  },
  {
    path: 'news',
    loadComponent: () => import('./news/news.page').then(m => m.NewsPage), canActivate: [AuthGuard]
  },
  {
    path: 'list-student',
    loadComponent: () => import('./list-student/list-student.page').then(m => m.ListStudentPage), canActivate: [AuthGuard]
  },
  {
    path: 'student-detail',
    loadComponent: () => import('./student-detail/student-detail.page').then(m => m.StudentDetailPage), canActivate: [AuthGuard]
  },
  {
    path: 'create-class',
    loadComponent: () => import('./create-class/create-class.page').then(m => m.CreateClassPage), canActivate: [AuthGuard]
  },
  {
    path: 'sendmessage',
    loadComponent: () => import('./sendmessage/sendmessage.page').then(m => m.SendmessagePage), canActivate: [AuthGuard]
  },
  {
    path: 'parentconnect',
    loadComponent: () => import('./parentconnect/parentconnect.page').then(m => m.ParentconnectPage), canActivate: [AuthGuard]
  },
  {
    path: 'connect-new-message',
    loadComponent: () => import('./connect-new-message/connect-new-message.page').then(m => m.ConnectNewMessagePage), canActivate: [AuthGuard]
  },
  {
    path: 'connect-chat',
    loadComponent: () => import('./connect-chat/connect-chat.page').then(m => m.ConnectChatPage), canActivate: [AuthGuard]
  },
  {
    path: 'elearning-schools',
    loadComponent: () => import('./elearning-schools/elearning-schools.page').then(m => m.ElearningSchoolsPage), canActivate: [AuthGuard]
  },
  {
    path: 'elearning-school-video',
    loadComponent: () => import('./elearning-school-video/elearning-school-video.page').then(m => m.ElearningSchoolVideoPage), canActivate: [AuthGuard]
  },
  {
    path: 'playvideo',
    loadComponent: () => import('./playvideo/playvideo.page').then(m => m.PlayvideoPage), canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage), canActivate: [AuthGuard]
  },
  {
    path: 'my-schedule',
    loadComponent: () => import('./my-schedule/my-schedule.page').then(m => m.MySchedulePage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin, UserType.Teacher, UserType.Moderator] }
  },
  {
    path: 'children',
    loadComponent: () => import('./children/children.page').then(m => m.ChildrenPage), canActivate: [AuthGuard]
  },
  {
    path: 'students',
    loadComponent: () => import('./students/students.page').then(m => m.StudentsPage), canActivate: [AuthGuard]
  },
  {
    path: 'post-news',
    loadComponent: () => import('./post-news/post-news.page').then(m => m.PostNewsPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
  {
    path: 'parent-register',
    loadComponent: () => import('./parent-register/parent-register.page').then(m => m.ParentRegisterPage)
  },
  {
    path: 'edit-calss',
    loadComponent: () => import('./common-modal/edit-calss/edit-calss.page').then(m => m.EditCalssPage), canActivate: [AuthGuard]
  },
  {
    path: 'requested-parent',
    loadComponent: () => import('./requested-parent/requested-parent.page').then(m => m.RequestedParentPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
  {
    path: 'seminar-list',
    loadComponent: () => import('./seminar-list/seminar-list.page').then(m => m.SeminarListPage), canActivate: [AuthGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'search-student',
    loadComponent: () => import('./search-student/search-student.page').then(m => m.SearchStudentPage), canActivate: [AuthGuard]
  },
  {
    path: 'add-notes',
    loadComponent: () => import('./add-notes/add-notes.page').then(m => m.AddNotesPage), canActivate: [AuthGuard]
  },
  {
    path: 'view-class-notes',
    loadComponent: () => import('./common-modal/view-class-notes/view-class-notes.page').then(m => m.ViewClassNotesPage), canActivate: [AuthGuard]
  },
  {
    path: 'manage-teacher',
    loadComponent: () => import('./manage-teacher/manage-teacher.page').then(m => m.ManageTeacherPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
  {
    path: 'edit-teacher-profile',
    loadComponent: () => import('./edit-teacher-profile/edit-teacher-profile.page').then(m => m.EditTeacherProfilePage), canActivate: [AuthGuard]
  },
  {
    path: 'follow-bulletins',
    loadComponent: () => import('./follow-bulletins/follow-bulletins.page').then(m => m.FollowBulletinsPage), canActivate: [AuthGuard]
  },
  {
    path: 'bulletins',
    loadComponent: () => import('./bulletins/bulletins.page').then(m => m.BulletinsPage), canActivate: [AuthGuard]
  },
  {
    path: 'manage-student',
    loadComponent: () => import('./manage-student/manage-student.page').then(m => m.ManageStudentPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
  {
    path: 'edit-student-profile',
    loadComponent: () => import('./edit-student-profile/edit-student-profile.page').then(m => m.EditStudentProfilePage), canActivate: [AuthGuard]
  },
  {
    path: 'available-plan',
    loadComponent: () => import('./available-plan/available-plan.page').then(m => m.AvailablePlanPage), canActivate: [AuthGuard]
  },
  {
    path: 'select-bulletins-user',
    loadComponent: () => import('./select-bulletins-user/select-bulletins-user.page').then(m => m.SelectBulletinsUserPage), canActivate: [AuthGuard]
  },
  {
    path: 'share-bulletins',
    loadComponent: () => import('./share-bulletins/share-bulletins.page').then(m => m.ShareBulletinsPage), canActivate: [AuthGuard]
  },
  {
    path: 'view-notes',
    loadComponent: () => import('./view-notes/view-notes.page').then(m => m.ViewNotesPage), canActivate: [AuthGuard]
  },
  {
    path: 'view-bulletin',
    loadComponent: () => import('./view-bulletin/view-bulletin.page').then(m => m.ViewBulletinPage), canActivate: [AuthGuard]
  },
  {
    path: 'select-message-user',
    loadComponent: () => import('./common-modal/select-message-user/select-message-user.page').then(m => m.SelectMessageUserPage), canActivate: [AuthGuard]
  },
  {
    path: 'warning-report',
    loadComponent: () => import('./warning-report/warning-report.page').then(m => m.WarningReportPage), canActivate: [AuthGuard]
  },
  {
    path: 'follow-up-student',
    loadComponent: () => import('./follow-up-student/follow-up-student.page').then(m => m.FollowUpStudentPage), canActivate: [AuthGuard]
  },
  {
    path: 'add-class',
    loadComponent: () => import('./add-class/add-class.page').then(m => m.AddClassPage), canActivate: [AuthGuard]
  },
  {
    path: 'followup-student-list',
    loadComponent: () => import('./followup-student-list/followup-student-list.page').then(m => m.FollowupStudentListPage), canActivate: [AuthGuard]
  },
  {
    path: 'student-report-classes',
    loadComponent: () => import('./student-report-classes/student-report-classes.page').then(m => m.StudentReportClassesPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin, UserType.Moderator, UserType.Viewer] }
  },
  {
    path: 'student-report-list',
    loadComponent: () => import('./student-report-list/student-report-list.page').then(m => m.StudentReportListPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin, UserType.Moderator, UserType.Viewer] }
  },
  {
    path: 'student-report-manage',
    loadComponent: () => import('./student-report-manage/student-report-manage.page').then(m => m.StudentReportManagePage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin, UserType.Moderator, UserType.Viewer, UserType.Medical] }
  },
  {
    path: 'followup-add-fields',
    loadComponent: () => import('./followup-add-fields/followup-add-fields.page').then(m => m.FollowupAddFieldsPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Teacher, UserType.Admin, UserType.Moderator] }
  },
  {
    path: 'add-teacher',
    loadComponent: () => import('./add-teacher/add-teacher.page').then(m => m.AddTeacherPage), canActivate: [AuthGuard]
  },
  {
    path: 'add-parent',
    loadComponent: () => import('./add-parent/add-parent.page').then(m => m.AddParentPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
 
  {
    path: 'note-calendar',
    loadComponent: () => import('./note-calendar/note-calendar.page').then(m => m.NoteCalendarPage), canActivate: [AuthGuard]
  },
  {
    path: 'users-list',
    loadComponent: () => import('./users-list/users-list.page').then(m => m.UsersListPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
  {
    path: 'add-user',
    loadComponent: () => import('./add-user/add-user.page').then(m => m.AddUserPage), canActivate: [AuthGuard]
  },
  {
    path: 'edit-user-profile',
    loadComponent: () => import('./edit-user-profile/edit-user-profile.page').then(m => m.EditUserProfilePage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
  {
    path: 'tasks-calendar',
    loadComponent: () => import('./tasks-calendar/tasks-calendar.page').then(m => m.TasksCalendarPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }
  },
  {
    path: 'profile-image',
    loadComponent: () => import('./modals/profile-image/profile-image.page').then(m => m.ProfileImagePage), canActivate: [AuthGuard]
  },
  {
    path: 'apply-vouches-code',
    loadComponent: () => import('./apply-vouches-code/apply-vouches-code.page').then(m => m.ApplyVouchesCodePage), canActivate: [AuthGuard]
  },
  {
    path: 'absent-students',
    loadComponent: () => import('./absent-students/absent-students.page').then(m => m.AbsentStudentsPage), canActivate: [AuthGuard]
  },
  {
    path: 'submit-absent-application',
    loadComponent: () => import('./submit-absent-application/submit-absent-application.page').then(m => m.SubmitAbsentApplicationPage), canActivate: [AuthGuard]
  },
  {
    path: 'all-application-list',
    loadComponent: () => import('./all-application-list/all-application-list.page').then(m => m.AllApplicationListPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin, UserType.Teacher, UserType.Moderator, UserType.Viewer, UserType.Register, UserType.Medical] }
  },
  {
    path: 'view-application-details',
    loadComponent: () => import('./view-application-details/view-application-details.page').then(m => m.ViewApplicationDetailsPage),
    canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin, UserType.Teacher, UserType.Moderator, UserType.Viewer, UserType.Register, UserType.Medical] }
  },
  {
    path: 'all-devices',
    loadComponent: () => import('./all-devices/all-devices.page').then(m => m.AllDevicesPage), canActivate: [AuthGuard]
  },
  {
    path: 'pdfviewer',
    loadComponent: () => import('./pdfviewer/pdfviewer.page').then(m => m.PdfviewerPage), canActivate: [AuthGuard]
  },
  {
    path: 'user-selection',
    loadComponent: () => import('./user-selection/user-selection.page').then(m => m.UserSelectionPage), canActivate: [AuthGuard]
  },
  {
    path: 'student-titles',
    loadComponent: () => import('./student-titles/student-titles.page').then(m => m.StudentTitlesPage), canActivate: [AuthGuard]
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: SelectivePreloadingStrategyService })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
