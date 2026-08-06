import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';

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
    loadComponent: () => import('./news/news.page').then(m => m.NewsPage)
  },
  {
    path: 'tabs/news',
    loadComponent: () => import('./news/news.page').then(m => m.NewsPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then( m => m.TabsPageModule)
  },
  {
    path: 'classlist',
    loadComponent: () => import('./classlist/classlist.page').then(m => m.ClasslistPage)
  },
  {
    path: 'tabs/classlist',
    loadComponent: () => import('./classlist/classlist.page').then(m => m.ClasslistPage)
  },
  {
    path: 'delaylist',
    loadComponent: () => import('./delaylist/delaylist.page').then(m => m.DelaylistPage)
  },
  {
    path: 'tabs/delaylist',
    loadComponent: () => import('./delaylist/delaylist.page').then(m => m.DelaylistPage)
  },
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages.page').then(m => m.MessagesPage)
  },
  {
    path: 'tabs/messages',
    loadComponent: () => import('./messages/messages.page').then(m => m.MessagesPage)
  },
  {
    path: 'list-student',
    loadComponent: () => import('./list-student/list-student.page').then(m => m.ListStudentPage)
  },
  {
    path: 'student-detail',
    loadComponent: () => import('./student-detail/student-detail.page').then(m => m.StudentDetailPage)
  },
  {
    path: 'create-class',
    loadComponent: () => import('./create-class/create-class.page').then(m => m.CreateClassPage)
  },
  {
    path: 'sendmessage',
    loadComponent: () => import('./sendmessage/sendmessage.page').then(m => m.SendmessagePage)
  },
  {
    path: 'parentconnect',
    loadComponent: () => import('./parentconnect/parentconnect.page').then(m => m.ParentconnectPage)
  },
  {
    path: 'tabs/parentconnect',
    loadComponent: () => import('./parentconnect/parentconnect.page').then(m => m.ParentconnectPage)
  },
  {
    path: 'connect-new-message',
    loadComponent: () => import('./connect-new-message/connect-new-message.page').then(m => m.ConnectNewMessagePage)
  },
  {
    path: 'connect-chat',
    loadComponent: () => import('./connect-chat/connect-chat.page').then(m => m.ConnectChatPage)
  },
  {
    path: 'elearning-schools',
    loadComponent: () => import('./elearning-schools/elearning-schools.page').then(m => m.ElearningSchoolsPage)
  },
  {
    path: 'tabs/elearning-schools',
    loadComponent: () => import('./elearning-schools/elearning-schools.page').then(m => m.ElearningSchoolsPage)
  },
  {
    path: 'elearning-school-video',
    loadComponent: () => import('./elearning-school-video/elearning-school-video.page').then(m => m.ElearningSchoolVideoPage)
  },
  {
    path: 'playvideo',
    loadComponent: () => import('./playvideo/playvideo.page').then(m => m.PlayvideoPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'children',
    loadComponent: () => import('./children/children.page').then(m => m.ChildrenPage), canActivate: [AuthGuard]
  },
  {
    path: 'tabs/children',
    loadComponent: () => import('./children/children.page').then(m => m.ChildrenPage), canActivate: [AuthGuard]
  },
  {
    path: 'private-message',
    loadComponent: () => import('./private-message/private-message.page').then(m => m.PrivateMessagePage)
  },
  {
    path: 'tabs/private-message',
    loadComponent: () => import('./private-message/private-message.page').then(m => m.PrivateMessagePage)
  },
  {
    path: 'students',
    loadComponent: () => import('./students/students.page').then(m => m.StudentsPage)
  },
  {
    path: 'post-news',
    loadComponent: () => import('./post-news/post-news.page').then(m => m.PostNewsPage)
  },
  {
    path: 'parent-register',
    loadComponent: () => import('./parent-register/parent-register.page').then(m => m.ParentRegisterPage)
  },
  {
    path: 'edit-calss',
    loadComponent: () => import('./common-modal/edit-calss/edit-calss.page').then(m => m.EditCalssPage)
  },
  {
    path: 'requested-parent',
    loadComponent: () => import('./requested-parent/requested-parent.page').then(m => m.RequestedParentPage)
  },
  {
    path: 'seminar-list',
    loadComponent: () => import('./seminar-list/seminar-list.page').then(m => m.SeminarListPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'search-student',
    loadComponent: () => import('./search-student/search-student.page').then(m => m.SearchStudentPage)
  },
  {
    path: 'student-notes',
    loadComponent: () => import('./student-notes/student-notes.page').then(m => m.StudentNotesPage)
  },
  {
    path: 'tabs/student-notes',
    loadComponent: () => import('./student-notes/student-notes.page').then(m => m.StudentNotesPage)
  },
  {
    path: 'add-notes',
    loadComponent: () => import('./add-notes/add-notes.page').then(m => m.AddNotesPage)
  },
  {
    path: 'view-class-notes',
    loadComponent: () => import('./common-modal/view-class-notes/view-class-notes.page').then(m => m.ViewClassNotesPage)
  },
  {
    path: 'manage-teacher',
    loadComponent: () => import('./manage-teacher/manage-teacher.page').then(m => m.ManageTeacherPage)
  },
  {
    path: 'edit-teacher-profile',
    loadComponent: () => import('./edit-teacher-profile/edit-teacher-profile.page').then(m => m.EditTeacherProfilePage)
  },
  {
    path: 'follow-bulletins',
    loadComponent: () => import('./follow-bulletins/follow-bulletins.page').then(m => m.FollowBulletinsPage)
  },
  {
    path: 'bulletins',
    loadComponent: () => import('./bulletins/bulletins.page').then(m => m.BulletinsPage)
  },
  {
    path: 'manage-student',
    loadComponent: () => import('./manage-student/manage-student.page').then(m => m.ManageStudentPage)
  },
  {
    path: 'edit-student-profile',
    loadComponent: () => import('./edit-student-profile/edit-student-profile.page').then(m => m.EditStudentProfilePage)
  },
  {
    path: 'available-plan',
    loadComponent: () => import('./available-plan/available-plan.page').then(m => m.AvailablePlanPage)
  },
  {
    path: 'select-bulletins-user',
    loadComponent: () => import('./select-bulletins-user/select-bulletins-user.page').then(m => m.SelectBulletinsUserPage)
  },
  {
    path: 'share-bulletins',
    loadComponent: () => import('./share-bulletins/share-bulletins.page').then(m => m.ShareBulletinsPage)
  },
  {
    path: 'view-notes',
    loadComponent: () => import('./view-notes/view-notes.page').then(m => m.ViewNotesPage)
  },
  {
    path: 'view-bulletin',
    loadComponent: () => import('./view-bulletin/view-bulletin.page').then(m => m.ViewBulletinPage)
  },
  {
    path: 'select-message-user',
    loadComponent: () => import('./common-modal/select-message-user/select-message-user.page').then(m => m.SelectMessageUserPage)
  },
  {
    path: 'warning-report',
    loadComponent: () => import('./warning-report/warning-report.page').then(m => m.WarningReportPage)
  },
  {
    path: 'follow-up-student',
    loadComponent: () => import('./follow-up-student/follow-up-student.page').then(m => m.FollowUpStudentPage)
  },
  {
    path: 'add-class',
    loadComponent: () => import('./add-class/add-class.page').then(m => m.AddClassPage)
  },
  {
    path: 'followup-student-list',
    loadComponent: () => import('./followup-student-list/followup-student-list.page').then(m => m.FollowupStudentListPage)
  },
  {
    path: 'student-report-classes',
    loadComponent: () => import('./student-report-classes/student-report-classes.page').then(m => m.StudentReportClassesPage)
  },
  {
    path: 'student-report-list',
    loadComponent: () => import('./student-report-list/student-report-list.page').then(m => m.StudentReportListPage)
  },
  {
    path: 'student-report-manage',
    loadComponent: () => import('./student-report-manage/student-report-manage.page').then(m => m.StudentReportManagePage)
  },
  {
    path: 'followup-add-fields',
    loadComponent: () => import('./followup-add-fields/followup-add-fields.page').then(m => m.FollowupAddFieldsPage)
  },
  {
    path: 'add-teacher',
    loadComponent: () => import('./add-teacher/add-teacher.page').then(m => m.AddTeacherPage)
  },
  {
    path: 'add-parent',
    loadComponent: () => import('./add-parent/add-parent.page').then(m => m.AddParentPage)
  },
 
  {
    path: 'note-calendar',
    loadComponent: () => import('./note-calendar/note-calendar.page').then(m => m.NoteCalendarPage)
  },
  {
    path: 'users-list',
    loadComponent: () => import('./users-list/users-list.page').then(m => m.UsersListPage)
  },
  {
    path: 'add-user',
    loadComponent: () => import('./add-user/add-user.page').then(m => m.AddUserPage)
  },
  {
    path: 'edit-user-profile',
    loadComponent: () => import('./edit-user-profile/edit-user-profile.page').then(m => m.EditUserProfilePage)
  },
  {
    path: 'tasks-calendar',
    loadComponent: () => import('./tasks-calendar/tasks-calendar.page').then(m => m.TasksCalendarPage)
  },
  {
    path: 'profile-image',
    loadComponent: () => import('./modals/profile-image/profile-image.page').then(m => m.ProfileImagePage)
  },
  {
    path: 'apply-vouches-code',
    loadComponent: () => import('./apply-vouches-code/apply-vouches-code.page').then(m => m.ApplyVouchesCodePage)
  },
  {
    path: 'absent-students',
    loadComponent: () => import('./absent-students/absent-students.page').then(m => m.AbsentStudentsPage)
  },
  {
    path: 'submit-absent-application',
    loadComponent: () => import('./submit-absent-application/submit-absent-application.page').then(m => m.SubmitAbsentApplicationPage)
  },
  {
    path: 'all-application-list',
    loadComponent: () => import('./all-application-list/all-application-list.page').then(m => m.AllApplicationListPage)
  },
  {
    path: 'view-application-details',
    loadComponent: () => import('./view-application-details/view-application-details.page').then(m => m.ViewApplicationDetailsPage)
  },
  {
    path: 'all-devices',
    loadComponent: () => import('./all-devices/all-devices.page').then(m => m.AllDevicesPage)
  },
  {
    path: 'pdfviewer',
    loadComponent: () => import('./pdfviewer/pdfviewer.page').then(m => m.PdfviewerPage)
  },
  {
    path: 'user-selection',
    loadComponent: () => import('./user-selection/user-selection.page').then(m => m.UserSelectionPage)
  },
  {
    path: 'student-titles',
    loadComponent: () => import('./student-titles/student-titles.page').then(m => m.StudentTitlesPage)
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
