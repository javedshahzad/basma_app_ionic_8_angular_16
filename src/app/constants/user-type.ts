/**
 * Backend-assigned role codes (`details.user_type` in API responses / stored
 * session). Values are strings because that's what the backend actually
 * sends — kept as a string enum so `userType === UserType.Admin` compiles to
 * the exact same runtime comparison as the old `userType === '1'`.
 */
export enum UserType {
  Admin = '1',
  Teacher = '2',
  Moderator = '3',
  Parent = '4',
  // 5 and 6 were real backend role codes with no prior frontend constant --
  // edit-user-profile.page.html already excludes both together (as raw
  // strings) from the attendance-edit-permission toggle, and
  // student-report-manage.page.html separately gates its medical-report
  // section on raw '6'. Named here, matching the enum's own established
  // pattern, rather than left as unexplained magic strings.
  Register = '5',
  Medical = '6',
  Viewer = '7',
  Student = '8',
}
