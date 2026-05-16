// Replace with: pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// Manual types that mirror the schema — must satisfy supabase-js GenericSchema constraints.

export type UserRole = 'coach' | 'student' | 'parent' | 'admin'
export type CoachDivision = 'admin' | 'research' | 'paper' | 'presentation' | 'marketing' | 'intern'
export type SessionMedia = 'online' | 'offline'
export type TaskRefType = 'file' | 'link'
export type DriveLinkType = 'team_report' | 'team_docs' | 'student_personal'
export type WaStatus = 'pending' | 'sent' | 'failed'
export type OauthScopeSet = 'basic' | 'drive_calendar'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: UserRole
          display_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          role?: UserRole
          display_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          id: string
          user_id: string
          scope_level: OauthScopeSet
          access_token: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          scope_level: OauthScopeSet
          access_token: string
          expires_at?: string | null
        }
        Update: {
          scope_level?: OauthScopeSet
          access_token?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          npsn: string
          name: string
          address: string | null
          created_at: string
        }
        Insert: { npsn: string; name: string; address?: string | null }
        Update: { name?: string; address?: string | null }
        Relationships: []
      }
      coaches: {
        Row: {
          id: string
          nama: string
          nomor_hp: string | null
          work_email: string | null
          foto_url: string | null
          divisi: CoachDivision
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nama: string
          nomor_hp?: string | null
          work_email?: string | null
          foto_url?: string | null
          divisi: CoachDivision
        }
        Update: {
          nama?: string
          nomor_hp?: string | null
          work_email?: string | null
          foto_url?: string | null
          divisi?: CoachDivision
        }
        Relationships: []
      }
      coach_skills: {
        Row: { id: string; coach_id: string; skill: string; created_at: string }
        Insert: { coach_id: string; skill: string }
        Update: { skill?: string }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          nama: string
          nomor_hp: string | null
          sekolah_npsn: string | null
          kelas: string | null
          jurusan: string | null
          umur: number | null
          nisn: string | null
          npsn: string | null
          email_lomba: string | null
          foto_url: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nama: string
          nomor_hp?: string | null
          sekolah_npsn?: string | null
          kelas?: string | null
          jurusan?: string | null
          umur?: number | null
          nisn?: string | null
          npsn?: string | null
          email_lomba?: string | null
          foto_url?: string | null
        }
        Update: {
          nama?: string
          nomor_hp?: string | null
          sekolah_npsn?: string | null
          kelas?: string | null
          jurusan?: string | null
          umur?: number | null
          nisn?: string | null
          npsn?: string | null
          email_lomba?: string | null
          foto_url?: string | null
        }
        Relationships: []
      }
      parents: {
        Row: {
          id: string
          nama: string
          nomor_hp_pemantau: string | null
          created_at: string
          updated_at: string
        }
        Insert: { id: string; nama: string; nomor_hp_pemantau?: string | null }
        Update: { nama?: string; nomor_hp_pemantau?: string | null }
        Relationships: []
      }
      parent_students: {
        Row: { id: string; parent_id: string; student_id: string; created_at: string }
        Insert: { parent_id: string; student_id: string }
        Update: Record<string, never>
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          team_code: string
          nama_tim: string | null
          judul_penelitian: string | null
          coach_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          nama_tim?: string | null
          judul_penelitian?: string | null
          coach_id?: string | null
        }
        Update: {
          nama_tim?: string | null
          judul_penelitian?: string | null
          coach_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: { id: string; team_id: string; student_id: string; created_at: string }
        Insert: { team_id: string; student_id: string }
        Update: Record<string, never>
        Relationships: []
      }
      classes: {
        Row: {
          id: string
          date: string
          time: string
          duration_minutes: number | null
          media: SessionMedia
          location: string | null
          maps_url: string | null
          topic: string | null
          gmeet_link: string | null
          gcal_event_id: string | null
          created_by: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          date: string
          time: string
          duration_minutes?: number | null
          media: SessionMedia
          location?: string | null
          maps_url?: string | null
          topic?: string | null
          gmeet_link?: string | null
          gcal_event_id?: string | null
          created_by?: string | null
        }
        Update: {
          date?: string
          time?: string
          duration_minutes?: number | null
          media?: SessionMedia
          location?: string | null
          maps_url?: string | null
          topic?: string | null
          gmeet_link?: string | null
          gcal_event_id?: string | null
        }
        Relationships: []
      }
      class_teams: {
        Row: { id: string; class_id: string; team_id: string; created_at: string }
        Insert: { class_id: string; team_id: string }
        Update: Record<string, never>
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          class_id: string | null
          team_id: string | null
          date: string
          duration_minutes: number | null
          media: SessionMedia
          location: string | null
          topic: string | null
          achievement: string | null
          homework: string | null
          evaluation: string | null
          drive_report_url: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          team_id?: string | null
          date: string
          duration_minutes?: number | null
          media: SessionMedia
          location?: string | null
          topic?: string | null
          achievement?: string | null
          homework?: string | null
          evaluation?: string | null
        }
        Update: {
          drive_report_url?: string | null
          achievement?: string | null
          homework?: string | null
          evaluation?: string | null
        }
        Relationships: []
      }
      session_student_reports: {
        Row: {
          id: string
          session_id: string
          student_id: string
          score_penguasaan: number | null
          score_presentasi: number | null
          score_keaktifan: number | null
          score_kedisiplinan: number | null
          score_kreativitas: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          session_id: string
          student_id: string
          score_penguasaan?: number | null
          score_presentasi?: number | null
          score_keaktifan?: number | null
          score_kedisiplinan?: number | null
          score_kreativitas?: number | null
          notes?: string | null
        }
        Update: {
          score_penguasaan?: number | null
          score_presentasi?: number | null
          score_keaktifan?: number | null
          score_kedisiplinan?: number | null
          score_kreativitas?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      session_docs: {
        Row: {
          id: string
          session_id: string
          storage_path: string
          created_at: string
        }
        Insert: { session_id: string; storage_path: string }
        Update: Record<string, never>
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          deadline: string | null
          team_id: string | null
          student_id: string | null
          submission_url: string | null
          is_completed: boolean
          created_by: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          deadline?: string | null
          team_id?: string | null
          student_id?: string | null
          submission_url?: string | null
          is_completed?: boolean
          created_by?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          deadline?: string | null
          submission_url?: string | null
          is_completed?: boolean
        }
        Relationships: []
      }
      task_refs: {
        Row: {
          id: string
          task_id: string
          ref_type: TaskRefType
          name: string
          url: string
          created_at: string
        }
        Insert: { task_id: string; ref_type: TaskRefType; name: string; url: string }
        Update: { ref_type?: TaskRefType; name?: string; url?: string }
        Relationships: []
      }
      drive_links: {
        Row: {
          id: string
          team_id: string
          link_type: DriveLinkType
          url: string
          created_at: string
          updated_at: string
        }
        Insert: { team_id: string; link_type: DriveLinkType; url: string }
        Update: { url?: string }
        Relationships: []
      }
      wa_notifications: {
        Row: {
          id: string
          recipient_hp: string
          message: string
          status: WaStatus
          sent_at: string | null
          error_msg: string | null
          created_at: string
        }
        Insert: { recipient_hp: string; message: string; status?: WaStatus }
        Update: { status?: WaStatus; sent_at?: string | null; error_msg?: string | null }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      coach_division: CoachDivision
      session_media: SessionMedia
      task_ref_type: TaskRefType
      drive_link_type: DriveLinkType
      wa_status: WaStatus
      oauth_scope_set: OauthScopeSet
    }
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Coach = Database['public']['Tables']['coaches']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Parent = Database['public']['Tables']['parents']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskRef = Database['public']['Tables']['task_refs']['Row']
export type DriveLink = Database['public']['Tables']['drive_links']['Row']
export type WaNotification = Database['public']['Tables']['wa_notifications']['Row']
export type SessionStudentReport = Database['public']['Tables']['session_student_reports']['Row']
export type OauthToken = Database['public']['Tables']['oauth_tokens']['Row']
