import { Injectable } from '@angular/core';
import { NotesApiService } from '../notes-api/notes-api.service';
import { GamificationApiService } from '../gamification-api/gamification-api.service';
import { UserManagementApiService } from '../user-management-api/user-management-api.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { StudentUiService } from '../student-ui/student-ui.service';

export interface AvatarUploadResult {
  success: boolean;
  /** Cache-busted URL of the newly uploaded avatar, set only when success is true. */
  url?: string;
  /** Error/failure message from the server or catch block, set only when success is false. */
  message?: string;
}

/**
 * Centralizes the student-profile network calls (avatar upload, notes,
 * skill points/titles) that were independently copy-pasted across
 * list-student, followup-student-list, student-detail and students pages.
 * Deliberately does not manage the loading indicator or touch any
 * page-local arrays/UI state — callers keep wrapping calls in
 * DataService.run() (or not) exactly as they already do, and keep patching
 * their own student objects/lists on success. This only removes the
 * duplicated payload-shaping + response-shape handling.
 */
@Injectable({
  providedIn: 'root'
})
export class StudentEngagementService {

  constructor(
    private notesApi: NotesApiService,
    private gamificationApi: GamificationApiService,
    private userManagementApi: UserManagementApiService,
    private imageService: ImageProcessingService,
    private studentUi: StudentUiService
  ) { }

  /**
   * Presents the camera/gallery/avatar-library action sheet and, for camera
   * or gallery, captures the image and returns its base64 data directly.
   * For the avatar-library option, only the action is returned — the caller
   * still drives openAvatarModal itself, since only it knows which local
   * student object/array to optimistically patch before upload.
   */
  async captureAvatarImage(event: any, lang: any): Promise<{ action: 'camera' | 'gallery' | 'avatar' | null; base64?: string }> {
    const action = await this.studentUi.presentImageOptions(event, lang) as 'camera' | 'gallery' | 'avatar' | null;
    if (action === 'camera' || action === 'gallery') {
      const base64 = await this.imageService.takePicture(action);
      return { action, base64 };
    }
    return { action };
  }

  /**
   * Uploads a student's avatar. Accepts either a raw base64 string or a
   * data: URI (both forms were used across pages) and normalizes it.
   *
   * Only resolves {success:false} for a request that the server answered
   * with a logical failure (session:false) — network/transport errors are
   * left to reject/throw so callers can keep telling the two cases apart
   * (e.g. only flushing local storage on a real API-level failure).
   */
  async uploadAvatar(base64Data: string, opts: { user_no: any; session_id: any; sid: any }): Promise<AvatarUploadResult> {
    if (!base64Data) {
      return { success: false };
    }

    const finalImageData = base64Data.includes('data:image')
      ? base64Data
      : 'data:image/png;base64,' + base64Data;

    const data = {
      user_no: opts.user_no,
      session_id: opts.session_id,
      imageData: finalImageData,
      sid: opts.sid
    };

    const response: any = await this.userManagementApi.updateUserImage(data);
    if (response && response.session) {
      return { success: true, url: response.url + '?t=' + new Date().getTime() };
    }
    return { success: false, message: response ? response.message : undefined };
  }

  /** Submits a new student note (plain text or star review — payload shape is caller-defined). */
  addNote(payload: any): Promise<any> {
    return this.notesApi.addStudentNote(payload);
  }

  /** Edits an existing student note. */
  editNote(payload: any): Promise<any> {
    return this.notesApi.EditStudentNote(payload);
  }

  /** Awards (or deducts) skill points for a student. */
  awardSkillPoints(body: any): Promise<any> {
    return this.gamificationApi.addStudentPoints(body);
  }

  /** Crafts (unlocks) a skill title for a student. */
  craftSkillTitle(body: any): Promise<any> {
    return this.gamificationApi.craftSkillTitle(body);
  }

  /** Equips/toggles the active title displayed for a student. */
  equipTitle(body: any): Promise<any> {
    return this.gamificationApi.equipTitle(body);
  }
}
