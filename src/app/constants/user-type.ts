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
  Viewer = '7',
  Student = '8',
}
