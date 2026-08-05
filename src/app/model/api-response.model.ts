/**
 * Shape of responses returned by the BasmaCP backend. Field presence varies
 * per endpoint (some use `session`, others `success`; some `msg`, others
 * `message`) so all fields are optional rather than modeling each endpoint
 * individually.
 */
export interface ApiResponse<T = unknown> {
  session?: boolean;
  success?: boolean;
  response?: T;
  data?: T;
  msg?: string;
  message?: string;
}
