// TIPOS GENERADOS DE LA BASE DE DATOS — no editar a mano.
//
// Hasta hoy (20-sep-2026) las consultas a Supabase viajaban como `any`: un
// nombre de columna mal escrito o un campo que ya no existe no lo veía el
// compilador, solo producción. Los dos informes de auditoría (el mío del
// 16-sep y el AS-IS de Alessandro) lo marcaban como P0.
//
// Regenerar cuando cambie el esquema (solo lectura, no toca la BD):
//   SUPABASE_ACCESS_TOKEN=<token> npx supabase gen types typescript \
//     --project-id nnevhtfxuawexliwlbmh --schema public > types/database.generated.ts
//
// 94 tablas. El cliente de servicio (lib/supabase.ts) ya los usa.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_tracking: {
        Row: {
          clicked_at: string | null
          client_id: string
          converted_at: string | null
          id: string
          referral_url: string | null
          tool_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          clicked_at?: string | null
          client_id: string
          converted_at?: string | null
          id?: string
          referral_url?: string | null
          tool_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          clicked_at?: string | null
          client_id?: string
          converted_at?: string | null
          id?: string
          referral_url?: string | null
          tool_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_tracking_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_activity: {
        Row: {
          agent_name: string
          agent_role: string
          client_id: string
          completed_at: string | null
          error_message: string | null
          id: string
          output_summary: string | null
          post_id: string | null
          started_at: string | null
          status: string | null
          task_type: string
        }
        Insert: {
          agent_name: string
          agent_role: string
          client_id: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          output_summary?: string | null
          post_id?: string | null
          started_at?: string | null
          status?: string | null
          task_type: string
        }
        Update: {
          agent_name?: string
          agent_role?: string
          client_id?: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          output_summary?: string | null
          post_id?: string | null
          started_at?: string | null
          status?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_history"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_assignments: {
        Row: {
          agent_type: string
          client_id: string
          config: Json | null
          created_at: string | null
          id: string
          run_schedule: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_type: string
          client_id: string
          config?: Json | null
          created_at?: string | null
          id?: string
          run_schedule?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_type?: string
          client_id?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          run_schedule?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_documents: {
        Row: {
          agent_role: string
          analysis_status: string
          analysis_summary: string | null
          analyzed_at: string | null
          client_id: string
          content_hash: string | null
          created_at: string | null
          description: string | null
          document_type: string
          extracted_text: string | null
          file_mime_type: string | null
          file_size: number | null
          file_url: string | null
          id: string
          key_points: Json | null
          original_filename: string | null
          project_id: string | null
          source_metadata: Json | null
          title: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          agent_role: string
          analysis_status?: string
          analysis_summary?: string | null
          analyzed_at?: string | null
          client_id: string
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string
          extracted_text?: string | null
          file_mime_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          key_points?: Json | null
          original_filename?: string | null
          project_id?: string | null
          source_metadata?: Json | null
          title: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          agent_role?: string
          analysis_status?: string
          analysis_summary?: string | null
          analyzed_at?: string | null
          client_id?: string
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string
          extracted_text?: string | null
          file_mime_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          key_points?: Json | null
          original_filename?: string | null
          project_id?: string | null
          source_metadata?: Json | null
          title?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_executions: {
        Row: {
          agent_type: string
          client_id: string
          creativities_generated: number | null
          executed_at: string | null
          id: string
          output_text: string | null
          prompt: string | null
          quality_score: number | null
          user_feedback: string | null
        }
        Insert: {
          agent_type: string
          client_id: string
          creativities_generated?: number | null
          executed_at?: string | null
          id?: string
          output_text?: string | null
          prompt?: string | null
          quality_score?: number | null
          user_feedback?: string | null
        }
        Update: {
          agent_type?: string
          client_id?: string
          creativities_generated?: number | null
          executed_at?: string | null
          id?: string
          output_text?: string | null
          prompt?: string | null
          quality_score?: number | null
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_interactions: {
        Row: {
          agent_name: string
          agent_response: string | null
          client_id: string
          created_at: string | null
          id: string
          outcome: string | null
          tags: Json | null
          updated_at: string | null
          user_feedback: string | null
          user_query: string
        }
        Insert: {
          agent_name: string
          agent_response?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          outcome?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_feedback?: string | null
          user_query: string
        }
        Update: {
          agent_name?: string
          agent_response?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          outcome?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_feedback?: string | null
          user_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_prompt_versions: {
        Row: {
          agent_role: string
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_content: string
          version: number
        }
        Insert: {
          agent_role: string
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_content: string
          version?: number
        }
        Update: {
          agent_role?: string
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_content?: string
          version?: number
        }
        Relationships: []
      }
      agent_settings: {
        Row: {
          agent_role: string
          autonomy: string
          client_id: string
          created_at: string | null
          id: string
          tone_level: number
          updated_at: string | null
        }
        Insert: {
          agent_role: string
          autonomy?: string
          client_id: string
          created_at?: string | null
          id?: string
          tone_level?: number
          updated_at?: string | null
        }
        Update: {
          agent_role?: string
          autonomy?: string
          client_id?: string
          created_at?: string | null
          id?: string
          tone_level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          canal: string
          client_id: string
          contenido: string
          created_at: string | null
          id: string
          prioridad: string | null
          propuesta_respuesta: string | null
          resolved_at: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          canal: string
          client_id: string
          contenido: string
          created_at?: string | null
          id?: string
          prioridad?: string | null
          propuesta_respuesta?: string | null
          resolved_at?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          canal?: string
          client_id?: string
          contenido?: string
          created_at?: string | null
          id?: string
          prioridad?: string | null
          propuesta_respuesta?: string | null
          resolved_at?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: []
      }
      apollo_enrichment_results: {
        Row: {
          apollo_data: Json | null
          client_id: string
          company_handbook_context: string | null
          company_name: string
          created_by: string | null
          crm_contact_id: string | null
          crm_ready: boolean | null
          crm_sync_status: string | null
          discovery_result_id: string | null
          enriched_at: string | null
          heat_score: number | null
          hunter_data: Json | null
          id: string
          industry: string | null
          personalization_email: string | null
          status: string | null
          synced_at: string | null
          website: string | null
        }
        Insert: {
          apollo_data?: Json | null
          client_id: string
          company_handbook_context?: string | null
          company_name: string
          created_by?: string | null
          crm_contact_id?: string | null
          crm_ready?: boolean | null
          crm_sync_status?: string | null
          discovery_result_id?: string | null
          enriched_at?: string | null
          heat_score?: number | null
          hunter_data?: Json | null
          id?: string
          industry?: string | null
          personalization_email?: string | null
          status?: string | null
          synced_at?: string | null
          website?: string | null
        }
        Update: {
          apollo_data?: Json | null
          client_id?: string
          company_handbook_context?: string | null
          company_name?: string
          created_by?: string | null
          crm_contact_id?: string | null
          crm_ready?: boolean | null
          crm_sync_status?: string | null
          discovery_result_id?: string | null
          enriched_at?: string | null
          heat_score?: number | null
          hunter_data?: Json | null
          id?: string
          industry?: string | null
          personalization_email?: string | null
          status?: string | null
          synced_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apollo_enrichment_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apollo_enrichment_results_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apollo_enrichment_results_discovery_result_id_fkey"
            columns: ["discovery_result_id"]
            isOneToOne: false
            referencedRelation: "lead_discovery_results"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_queue: {
        Row: {
          asset_url: string | null
          caption: string | null
          client_id: string
          copy: string | null
          edited_caption: string | null
          edited_copy: string | null
          hashtags: string[] | null
          id: string
          platform: string | null
          post_id: string | null
          production_notes: string | null
          qa_flags: Json | null
          reviewed_at: string | null
          reviewer_notes: string | null
          scheduled_time: string | null
          status: string | null
          submitted_at: string | null
          tipo: string
          tone_warning: boolean | null
        }
        Insert: {
          asset_url?: string | null
          caption?: string | null
          client_id: string
          copy?: string | null
          edited_caption?: string | null
          edited_copy?: string | null
          hashtags?: string[] | null
          id?: string
          platform?: string | null
          post_id?: string | null
          production_notes?: string | null
          qa_flags?: Json | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          scheduled_time?: string | null
          status?: string | null
          submitted_at?: string | null
          tipo: string
          tone_warning?: boolean | null
        }
        Update: {
          asset_url?: string | null
          caption?: string | null
          client_id?: string
          copy?: string | null
          edited_caption?: string | null
          edited_copy?: string | null
          hashtags?: string[] | null
          id?: string
          platform?: string | null
          post_id?: string | null
          production_notes?: string | null
          qa_flags?: Json | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          scheduled_time?: string | null
          status?: string | null
          submitted_at?: string | null
          tipo?: string
          tone_warning?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_queue_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_history"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_change_proposals: {
        Row: {
          applied_at: string | null
          changes: Json
          client_id: string
          created_at: string
          id: string
          origin: string
          project_id: string | null
          proposed_by: string | null
          resolved_by: string | null
          source_document_ids: string[] | null
          status: string
          summary: string
        }
        Insert: {
          applied_at?: string | null
          changes: Json
          client_id: string
          created_at?: string
          id?: string
          origin: string
          project_id?: string | null
          proposed_by?: string | null
          resolved_by?: string | null
          source_document_ids?: string[] | null
          status?: string
          summary: string
        }
        Update: {
          applied_at?: string | null
          changes?: Json
          client_id?: string
          created_at?: string
          id?: string
          origin?: string
          project_id?: string | null
          proposed_by?: string | null
          resolved_by?: string | null
          source_document_ids?: string[] | null
          status?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_change_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_change_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_contradictions: {
        Row: {
          client_id: string
          created_at: string
          existing_value_excerpt: string | null
          field_path: string
          id: string
          note: string
          project_id: string | null
          proposed_value_excerpt: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          source_document_id: string | null
          source_proposal_id: string | null
          source_type: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          existing_value_excerpt?: string | null
          field_path: string
          id?: string
          note: string
          project_id?: string | null
          proposed_value_excerpt?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_document_id?: string | null
          source_proposal_id?: string | null
          source_type: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          existing_value_excerpt?: string | null
          field_path?: string
          id?: string
          note?: string
          project_id?: string | null
          proposed_value_excerpt?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_document_id?: string | null
          source_proposal_id?: string | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_contradictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_contradictions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_contradictions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "agent_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_contradictions_source_proposal_id_fkey"
            columns: ["source_proposal_id"]
            isOneToOne: false
            referencedRelation: "brain_change_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_field_provenance: {
        Row: {
          client_id: string
          field_path: string
          id: string
          project_id: string | null
          source_ref: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          field_path: string
          id?: string
          project_id?: string | null
          source_ref?: string | null
          source_type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          field_path?: string
          id?: string
          project_id?: string | null
          source_ref?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_field_provenance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_field_provenance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_brains: {
        Row: {
          client_name: string | null
          client_slug: string
          id: string
          json_data: Json
          seeded_at: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_slug: string
          id?: string
          json_data?: Json
          seeded_at?: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_slug?: string
          id?: string
          json_data?: Json
          seeded_at?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      brand_documents: {
        Row: {
          analysis_result: Json | null
          analysis_status: string | null
          analyzed_at: string | null
          brand_profile_id: string
          client_id: string
          description: string | null
          document_type: string
          extracted_text: string | null
          file_mime_type: string | null
          file_size: number
          file_url: string
          id: string
          is_archived: boolean | null
          original_filename: string | null
          project_id: string | null
          suggested_updates: Json | null
          tags: string[] | null
          title: string
          uploaded_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          analysis_result?: Json | null
          analysis_status?: string | null
          analyzed_at?: string | null
          brand_profile_id: string
          client_id: string
          description?: string | null
          document_type: string
          extracted_text?: string | null
          file_mime_type?: string | null
          file_size: number
          file_url: string
          id?: string
          is_archived?: boolean | null
          original_filename?: string | null
          project_id?: string | null
          suggested_updates?: Json | null
          tags?: string[] | null
          title: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          analysis_result?: Json | null
          analysis_status?: string | null
          analyzed_at?: string | null
          brand_profile_id?: string
          client_id?: string
          description?: string | null
          document_type?: string
          extracted_text?: string | null
          file_mime_type?: string | null
          file_size?: number
          file_url?: string
          id?: string
          is_archived?: boolean | null
          original_filename?: string | null
          project_id?: string | null
          suggested_updates?: Json | null
          tags?: string[] | null
          title?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_documents_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          brand_data: Json | null
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          mission: string | null
          name: string
          proposition: string | null
          tone_of_voice: string | null
          updated_at: string | null
          values: Json | null
        }
        Insert: {
          brand_data?: Json | null
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          mission?: string | null
          name: string
          proposition?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          values?: Json | null
        }
        Update: {
          brand_data?: Json | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          mission?: string | null
          name?: string
          proposition?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_references: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          pillar: string | null
          project_id: string | null
          title: string
          updated_at: string | null
          url: string
          what_to_repeat: string | null
          why_worked: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          pillar?: string | null
          project_id?: string | null
          title: string
          updated_at?: string | null
          url: string
          what_to_repeat?: string | null
          why_worked?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          pillar?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          what_to_repeat?: string | null
          why_worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_references_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_references_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_resources: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          drive_url: string | null
          id: string
          metadata: Json | null
          resource_type: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          drive_url?: string | null
          id?: string
          metadata?: Json | null
          resource_type: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          drive_url?: string | null
          id?: string
          metadata?: Json | null
          resource_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_resources_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_submissions: {
        Row: {
          ai_feedback: string | null
          challenge_id: string
          content: string
          id: string
          score: number | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          challenge_id: string
          content: string
          id?: string
          score?: number | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          challenge_id?: string
          content?: string
          id?: string
          score?: number | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string
          discipline: string
          evaluation_criteria: Json
          id: string
          level: number
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          discipline: string
          evaluation_criteria?: Json
          id?: string
          level: number
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          discipline?: string
          evaluation_criteria?: Json
          id?: string
          level?: number
          title?: string
          type?: string
        }
        Relationships: []
      }
      client_documentation: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          doc_type: string | null
          embedding: string | null
          extracted_text: string | null
          file_mime_type: string | null
          file_size_bytes: number | null
          filename: string
          id: string
          is_archived: boolean | null
          project_id: string | null
          storage_url: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          doc_type?: string | null
          embedding?: string | null
          extracted_text?: string | null
          file_mime_type?: string | null
          file_size_bytes?: number | null
          filename: string
          id?: string
          is_archived?: boolean | null
          project_id?: string | null
          storage_url: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          doc_type?: string | null
          embedding?: string | null
          extracted_text?: string | null
          file_mime_type?: string | null
          file_size_bytes?: number | null
          filename?: string
          id?: string
          is_archived?: boolean | null
          project_id?: string | null
          storage_url?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documentation_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documentation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_goals: {
        Row: {
          brief: string
          client_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          period_end: string
          period_start: string
          spec: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brief: string
          client_id: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_end: string
          period_start: string
          spec?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brief?: string
          client_id?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          spec?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_questionnaires: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          ingested_at: string | null
          intro: string | null
          narrative: Json | null
          project_id: string | null
          source: string
          status: string
          title: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ingested_at?: string | null
          intro?: string | null
          narrative?: Json | null
          project_id?: string | null
          source?: string
          status?: string
          title: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ingested_at?: string | null
          intro?: string | null
          narrative?: Json | null
          project_id?: string | null
          source?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_questionnaires_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_questionnaires_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tools: {
        Row: {
          client_id: string
          enabled: boolean
          enabled_at: string
          enabled_by: string | null
          notes: string | null
          tool_id: string
        }
        Insert: {
          client_id: string
          enabled?: boolean
          enabled_at?: string
          enabled_by?: string | null
          notes?: string | null
          tool_id: string
        }
        Update: {
          client_id?: string
          enabled?: boolean
          enabled_at?: string
          enabled_by?: string | null
          notes?: string | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tools_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workspaces: {
        Row: {
          client_id: string
          workspace: string
        }
        Insert: {
          client_id: string
          workspace: string
        }
        Update: {
          client_id?: string
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workspaces_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_group_id: string | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          max_seats: number
          name: string
          onboarding_mode: string
          owner_email: string | null
          plan: string
          primary_color: string | null
          slug: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          billing_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_seats?: number
          name: string
          onboarding_mode?: string
          owner_email?: string | null
          plan?: string
          primary_color?: string | null
          slug: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_seats?: number
          name?: string
          onboarding_mode?: string
          owner_email?: string | null
          plan?: string
          primary_color?: string | null
          slug?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      concept_reviews: {
        Row: {
          concept: string
          created_at: string
          discipline: string
          id: string
          last_reviewed_at: string
          next_review_at: string
          review_count: number
          user_id: string
        }
        Insert: {
          concept: string
          created_at?: string
          discipline: string
          id?: string
          last_reviewed_at?: string
          next_review_at?: string
          review_count?: number
          user_id: string
        }
        Update: {
          concept?: string
          created_at?: string
          discipline?: string
          id?: string
          last_reviewed_at?: string
          next_review_at?: string
          review_count?: number
          user_id?: string
        }
        Relationships: []
      }
      content_pillars: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          examples: Json | null
          id: string
          pillar_name: string
          themes: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          examples?: Json | null
          id?: string
          pillar_name: string
          themes?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          examples?: Json | null
          id?: string
          pillar_name?: string
          themes?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_pillars_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          assigned_to: string | null
          classification: string | null
          company_name: string
          company_website: string | null
          created_at: string
          email: string | null
          first_name: string | null
          geography: string | null
          hot_score: number
          icebreaker: string | null
          id: string
          industry: string | null
          last_name: string | null
          linkedin_summary: string | null
          linkedin_url: string | null
          notes: string | null
          source: string | null
          stage: string
          title: string | null
          trigger_event: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          classification?: string | null
          company_name: string
          company_website?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          geography?: string | null
          hot_score?: number
          icebreaker?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          linkedin_summary?: string | null
          linkedin_url?: string | null
          notes?: string | null
          source?: string | null
          stage?: string
          title?: string | null
          trigger_event?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          classification?: string | null
          company_name?: string
          company_website?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          geography?: string | null
          hot_score?: number
          icebreaker?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          linkedin_summary?: string | null
          linkedin_url?: string | null
          notes?: string | null
          source?: string | null
          stage?: string
          title?: string | null
          trigger_event?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      curriculum: {
        Row: {
          created_at: string | null
          discipline: string
          id: string
          level: number
          module: string
          order_index: number
          topics: Json
        }
        Insert: {
          created_at?: string | null
          discipline: string
          id?: string
          level: number
          module: string
          order_index: number
          topics?: Json
        }
        Update: {
          created_at?: string | null
          discipline?: string
          id?: string
          level?: number
          module?: string
          order_index?: number
          topics?: Json
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          downloads_count: number | null
          expires_at: string | null
          file_type: string | null
          generation_queue_id: string
          id: string
          preview_url: string | null
          size_bytes: number | null
          status: string
          storage_url: string | null
          title: string
          tool_slug: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          expires_at?: string | null
          file_type?: string | null
          generation_queue_id: string
          id?: string
          preview_url?: string | null
          size_bytes?: number | null
          status?: string
          storage_url?: string | null
          title: string
          tool_slug: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          expires_at?: string | null
          file_type?: string | null
          generation_queue_id?: string
          id?: string
          preview_url?: string | null
          size_bytes?: number | null
          status?: string
          storage_url?: string | null
          title?: string
          tool_slug?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_generation_queue_id_fkey"
            columns: ["generation_queue_id"]
            isOneToOne: false
            referencedRelation: "generation_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      design_templates: {
        Row: {
          client_id: string
          created_at: string | null
          format: string
          id: string
          nombre: string
          performance_score: number | null
          platform: string
          preview_url: string | null
          uso_count: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          format: string
          id?: string
          nombre: string
          performance_score?: number | null
          platform: string
          preview_url?: string | null
          uso_count?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          format?: string
          id?: string
          nombre?: string
          performance_score?: number | null
          platform?: string
          preview_url?: string | null
          uso_count?: number | null
        }
        Relationships: []
      }
      discovery_runs: {
        Row: {
          client_id: string | null
          cold_count: number | null
          disqualified_count: number | null
          duration_seconds: number | null
          error: string | null
          finished_at: string | null
          hot_count: number | null
          icp_id: string | null
          id: string
          leads_found: number | null
          leads_scored: number | null
          sources_used: string[] | null
          started_at: string | null
          total_cost_usd: number | null
          warm_count: number | null
        }
        Insert: {
          client_id?: string | null
          cold_count?: number | null
          disqualified_count?: number | null
          duration_seconds?: number | null
          error?: string | null
          finished_at?: string | null
          hot_count?: number | null
          icp_id?: string | null
          id?: string
          leads_found?: number | null
          leads_scored?: number | null
          sources_used?: string[] | null
          started_at?: string | null
          total_cost_usd?: number | null
          warm_count?: number | null
        }
        Update: {
          client_id?: string | null
          cold_count?: number | null
          disqualified_count?: number | null
          duration_seconds?: number | null
          error?: string | null
          finished_at?: string | null
          hot_count?: number | null
          icp_id?: string | null
          id?: string
          leads_found?: number | null
          leads_scored?: number | null
          sources_used?: string[] | null
          started_at?: string | null
          total_cost_usd?: number | null
          warm_count?: number | null
        }
        Relationships: []
      }
      document_feedback: {
        Row: {
          action_id: string | null
          client_id: string
          context: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          outcome: string
          queue_id: string | null
          tool_slug: string
        }
        Insert: {
          action_id?: string | null
          client_id: string
          context?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          outcome: string
          queue_id?: string | null
          tool_slug: string
        }
        Update: {
          action_id?: string | null
          client_id?: string
          context?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          outcome?: string
          queue_id?: string | null
          tool_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_connections: {
        Row: {
          access_token: string
          auto_sync_enabled: boolean | null
          client_id: string
          created_at: string | null
          folder_id: string | null
          folder_name: string | null
          granted_scopes: string[] | null
          id: string
          is_authorized: boolean | null
          last_synced_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          auto_sync_enabled?: boolean | null
          client_id: string
          created_at?: string | null
          folder_id?: string | null
          folder_name?: string | null
          granted_scopes?: string[] | null
          id?: string
          is_authorized?: boolean | null
          last_synced_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          auto_sync_enabled?: boolean | null
          client_id?: string
          created_at?: string | null
          folder_id?: string | null
          folder_name?: string | null
          granted_scopes?: string[] | null
          id?: string
          is_authorized?: boolean | null
          last_synced_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      drive_folders: {
        Row: {
          auto_sync_enabled: boolean
          client_id: string
          created_at: string | null
          files_synced: number | null
          folder_id: string
          folder_name: string | null
          id: string
          last_synced_at: string | null
          project_id: string | null
          purpose: string | null
          sync_status: string | null
        }
        Insert: {
          auto_sync_enabled?: boolean
          client_id: string
          created_at?: string | null
          files_synced?: number | null
          folder_id: string
          folder_name?: string | null
          id?: string
          last_synced_at?: string | null
          project_id?: string | null
          purpose?: string | null
          sync_status?: string | null
        }
        Update: {
          auto_sync_enabled?: boolean
          client_id?: string
          created_at?: string | null
          files_synced?: number | null
          folder_id?: string
          folder_name?: string | null
          id?: string
          last_synced_at?: string | null
          project_id?: string | null
          purpose?: string | null
          sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drive_folders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drive_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_corrections: {
        Row: {
          after: Json | null
          before: Json | null
          client_id: string
          created_at: string
          created_by: string | null
          email_excerpt: string | null
          field: string
          id: string
          ticket_id: string
        }
        Insert: {
          after?: Json | null
          before?: Json | null
          client_id: string
          created_at?: string
          created_by?: string | null
          email_excerpt?: string | null
          field: string
          id?: string
          ticket_id: string
        }
        Update: {
          after?: Json | null
          before?: Json | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          email_excerpt?: string | null
          field?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_corrections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_corrections_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "email_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      email_inboxes: {
        Row: {
          active: boolean
          address: string
          client_id: string
          created_at: string
          created_by: string | null
          department: string
          display_name: string | null
          id: string
          imap_host: string | null
          imap_last_checked_at: string | null
          imap_last_error: string | null
          imap_last_uid: number | null
          imap_password: string | null
          imap_port: number
          imap_user: string | null
          source: string
        }
        Insert: {
          active?: boolean
          address: string
          client_id: string
          created_at?: string
          created_by?: string | null
          department: string
          display_name?: string | null
          id?: string
          imap_host?: string | null
          imap_last_checked_at?: string | null
          imap_last_error?: string | null
          imap_last_uid?: number | null
          imap_password?: string | null
          imap_port?: number
          imap_user?: string | null
          source?: string
        }
        Update: {
          active?: boolean
          address?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          department?: string
          display_name?: string | null
          id?: string
          imap_host?: string | null
          imap_last_checked_at?: string | null
          imap_last_error?: string | null
          imap_last_uid?: number | null
          imap_password?: string | null
          imap_port?: number
          imap_user?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_inboxes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          attachments: Json
          attempts: number
          cc_addresses: string[] | null
          client_id: string
          created_at: string
          extraction: Json | null
          from_address: string | null
          from_name: string | null
          html_body: string | null
          id: string
          in_reply_to: string | null
          inbox_id: string | null
          last_error: string | null
          message_id: string | null
          processed_at: string | null
          received_at: string
          references_ids: string[] | null
          resend_email_id: string
          status: string
          subject: string | null
          text_body: string | null
          thread_key: string | null
          ticket_id: string | null
          to_addresses: string[] | null
          updated_at: string
        }
        Insert: {
          attachments?: Json
          attempts?: number
          cc_addresses?: string[] | null
          client_id: string
          created_at?: string
          extraction?: Json | null
          from_address?: string | null
          from_name?: string | null
          html_body?: string | null
          id?: string
          in_reply_to?: string | null
          inbox_id?: string | null
          last_error?: string | null
          message_id?: string | null
          processed_at?: string | null
          received_at?: string
          references_ids?: string[] | null
          resend_email_id: string
          status?: string
          subject?: string | null
          text_body?: string | null
          thread_key?: string | null
          ticket_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string
        }
        Update: {
          attachments?: Json
          attempts?: number
          cc_addresses?: string[] | null
          client_id?: string
          created_at?: string
          extraction?: Json | null
          from_address?: string | null
          from_name?: string | null
          html_body?: string | null
          id?: string
          in_reply_to?: string | null
          inbox_id?: string | null
          last_error?: string | null
          message_id?: string | null
          processed_at?: string | null
          received_at?: string
          references_ids?: string[] | null
          resend_email_id?: string
          status?: string
          subject?: string | null
          text_body?: string | null
          thread_key?: string | null
          ticket_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "email_inboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "email_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ops_settings: {
        Row: {
          client_id: string
          required_fields: string[] | null
          rules: string | null
          schema_key: string
          updated_at: string
        }
        Insert: {
          client_id: string
          required_fields?: string[] | null
          rules?: string | null
          schema_key?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          required_fields?: string[] | null
          rules?: string | null
          schema_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_ops_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tickets: {
        Row: {
          client_id: string
          closed_at: string | null
          closed_by: string | null
          confidence: Json
          created_at: string
          delivery_type: string | null
          department: string | null
          evidence: Json
          fields: Json
          first_message_at: string | null
          from_address: string | null
          id: string
          inbox_id: string | null
          kind: string
          last_message_at: string | null
          manual_overrides: Json
          message_count: number
          missing_fields: string[]
          original_sender: string | null
          priority: number
          service_date: string | null
          status: string
          subject: string | null
          summary: string | null
          thread_key: string
          updated_at: string
          urgency: number | null
        }
        Insert: {
          client_id: string
          closed_at?: string | null
          closed_by?: string | null
          confidence?: Json
          created_at?: string
          delivery_type?: string | null
          department?: string | null
          evidence?: Json
          fields?: Json
          first_message_at?: string | null
          from_address?: string | null
          id?: string
          inbox_id?: string | null
          kind?: string
          last_message_at?: string | null
          manual_overrides?: Json
          message_count?: number
          missing_fields?: string[]
          original_sender?: string | null
          priority?: number
          service_date?: string | null
          status?: string
          subject?: string | null
          summary?: string | null
          thread_key: string
          updated_at?: string
          urgency?: number | null
        }
        Update: {
          client_id?: string
          closed_at?: string | null
          closed_by?: string | null
          confidence?: Json
          created_at?: string
          delivery_type?: string | null
          department?: string | null
          evidence?: Json
          fields?: Json
          first_message_at?: string | null
          from_address?: string | null
          id?: string
          inbox_id?: string | null
          kind?: string
          last_message_at?: string | null
          manual_overrides?: Json
          message_count?: number
          missing_fields?: string[]
          original_sender?: string | null
          priority?: number
          service_date?: string | null
          status?: string
          subject?: string | null
          summary?: string | null
          thread_key?: string
          updated_at?: string
          urgency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tickets_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "email_inboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_training_examples: {
        Row: {
          active: boolean
          attachments_text: string | null
          client_id: string
          created_at: string
          created_by: string | null
          email_text: string
          expected_fields: Json
          expected_kind: string
          id: string
          notes: string | null
          source: string
        }
        Insert: {
          active?: boolean
          attachments_text?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          email_text: string
          expected_fields?: Json
          expected_kind?: string
          id?: string
          notes?: string | null
          source?: string
        }
        Update: {
          active?: boolean
          attachments_text?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          email_text?: string
          expected_fields?: Json
          expected_kind?: string
          id?: string
          notes?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_training_examples_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      external_reports: {
        Row: {
          access_mode: string
          category: string
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          embed_url: string | null
          external_url: string | null
          id: string
          owner: string | null
          powerbi_workspace_id: string | null
          provider: string
          report_id: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          workspace_label: string | null
        }
        Insert: {
          access_mode?: string
          category?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          embed_url?: string | null
          external_url?: string | null
          id?: string
          owner?: string | null
          powerbi_workspace_id?: string | null
          provider?: string
          report_id?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_label?: string | null
        }
        Update: {
          access_mode?: string
          category?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          embed_url?: string | null
          external_url?: string | null
          id?: string
          owner?: string | null
          powerbi_workspace_id?: string | null
          provider?: string
          report_id?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_creativities: {
        Row: {
          agent_type: string | null
          canva_url: string | null
          client_id: string
          created_at: string | null
          description: string | null
          feedback: string | null
          id: string
          magnific_image_url: string | null
          magnific_prompt: string | null
          quality_score: number | null
          status: string | null
          text_content: string | null
          title: string
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          agent_type?: string | null
          canva_url?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          magnific_image_url?: string | null
          magnific_prompt?: string | null
          quality_score?: number | null
          status?: string | null
          text_content?: string | null
          title: string
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          agent_type?: string | null
          canva_url?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          magnific_image_url?: string | null
          magnific_prompt?: string | null
          quality_score?: number | null
          status?: string | null
          text_content?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_creativities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_queue: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_duration_minutes: number | null
          id: string
          input_data: Json
          n8n_execution_id: string | null
          project_id: string | null
          result_data: Json | null
          started_at: string | null
          status: string
          tool_slug: string
          user_id: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          input_data: Json
          n8n_execution_id?: string | null
          project_id?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string
          tool_slug: string
          user_id?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          input_data?: Json
          n8n_execution_id?: string | null
          project_id?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string
          tool_slug?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tasks: {
        Row: {
          action_id: string
          attempts: number
          client_id: string
          created_at: string
          decided_at: string | null
          depends_on: string | null
          generated_at: string | null
          goal_id: string
          id: string
          kind: string
          last_error: string | null
          max_attempts: number
          params: Json
          position: number
          reject_note: string | null
          result_kind: string | null
          result_ref: string | null
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          action_id: string
          attempts?: number
          client_id: string
          created_at?: string
          decided_at?: string | null
          depends_on?: string | null
          generated_at?: string | null
          goal_id: string
          id?: string
          kind: string
          last_error?: string | null
          max_attempts?: number
          params?: Json
          position?: number
          reject_note?: string | null
          result_kind?: string | null
          result_ref?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          attempts?: number
          client_id?: string
          created_at?: string
          decided_at?: string | null
          depends_on?: string | null
          generated_at?: string | null
          goal_id?: string
          id?: string
          kind?: string
          last_error?: string | null
          max_attempts?: number
          params?: Json
          position?: number
          reject_note?: string | null
          result_kind?: string | null
          result_ref?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tasks_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "goal_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "client_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      icp_profiles: {
        Row: {
          client_id: string
          company_sizes: string[] | null
          decision_maker_signals: string[] | null
          disqualifiers: string[] | null
          embedding: string | null
          geographies: string[] | null
          icp_name: string | null
          id: string
          industries: string[] | null
          job_titles: string[] | null
          min_budget_usd: number | null
          pain_points: string[] | null
          trigger_events: string[] | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          company_sizes?: string[] | null
          decision_maker_signals?: string[] | null
          disqualifiers?: string[] | null
          embedding?: string | null
          geographies?: string[] | null
          icp_name?: string | null
          id?: string
          industries?: string[] | null
          job_titles?: string[] | null
          min_budget_usd?: number | null
          pain_points?: string[] | null
          trigger_events?: string[] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          company_sizes?: string[] | null
          decision_maker_signals?: string[] | null
          disqualifiers?: string[] | null
          embedding?: string | null
          geographies?: string[] | null
          icp_name?: string | null
          id?: string
          industries?: string[] | null
          job_titles?: string[] | null
          min_budget_usd?: number | null
          pain_points?: string[] | null
          trigger_events?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      image_packs: {
        Row: {
          client_id: string
          created_at: string
          granted_by: string | null
          id: string
          images: number
          source: string
          stripe_session_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          images: number
          source: string
          stripe_session_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          images?: number
          source?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_packs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_cache: {
        Row: {
          cached_at: string | null
          domain: string
          expires_at: string | null
          id: string
          raw_data: Json | null
          sources: string[] | null
        }
        Insert: {
          cached_at?: string | null
          domain: string
          expires_at?: string | null
          id?: string
          raw_data?: Json | null
          sources?: string[] | null
        }
        Update: {
          cached_at?: string | null
          domain?: string
          expires_at?: string | null
          id?: string
          raw_data?: Json | null
          sources?: string[] | null
        }
        Relationships: []
      }
      lead_discovery_results: {
        Row: {
          client_id: string
          completed_at: string | null
          created_by: string | null
          discovery_geo: string | null
          discovery_query: string | null
          discovery_sector: string
          discovery_source: string | null
          error_message: string | null
          id: string
          leads_data: Json | null
          processing_time_ms: number | null
          results_url: string | null
          started_at: string | null
          status: string | null
          total_leads_found: number | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_by?: string | null
          discovery_geo?: string | null
          discovery_query?: string | null
          discovery_sector: string
          discovery_source?: string | null
          error_message?: string | null
          id?: string
          leads_data?: Json | null
          processing_time_ms?: number | null
          results_url?: string | null
          started_at?: string | null
          status?: string | null
          total_leads_found?: number | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_by?: string | null
          discovery_geo?: string | null
          discovery_query?: string | null
          discovery_sector?: string
          discovery_source?: string | null
          error_message?: string | null
          id?: string
          leads_data?: Json | null
          processing_time_ms?: number | null
          results_url?: string | null
          started_at?: string | null
          status?: string | null
          total_leads_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_discovery_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          bant_score: number | null
          call_scheduled_at: string | null
          campaign_id: string | null
          client_id: string
          company_name: string | null
          company_news: string | null
          company_size: string | null
          company_website: string | null
          created_at: string | null
          email: string | null
          first_contact_at: string | null
          first_name: string | null
          geography: string | null
          hot_score: number | null
          icebreaker_used: string | null
          icp_id: string | null
          id: string
          industry: string | null
          last_contact_at: string | null
          last_name: string | null
          linkedin_summary: string | null
          linkedin_url: string | null
          notes: string | null
          notion_page_id: string | null
          reply_received_at: string | null
          source: string | null
          stage: string | null
          title: string | null
          trigger_event: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          bant_score?: number | null
          call_scheduled_at?: string | null
          campaign_id?: string | null
          client_id: string
          company_name?: string | null
          company_news?: string | null
          company_size?: string | null
          company_website?: string | null
          created_at?: string | null
          email?: string | null
          first_contact_at?: string | null
          first_name?: string | null
          geography?: string | null
          hot_score?: number | null
          icebreaker_used?: string | null
          icp_id?: string | null
          id?: string
          industry?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          linkedin_summary?: string | null
          linkedin_url?: string | null
          notes?: string | null
          notion_page_id?: string | null
          reply_received_at?: string | null
          source?: string | null
          stage?: string | null
          title?: string | null
          trigger_event?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          bant_score?: number | null
          call_scheduled_at?: string | null
          campaign_id?: string | null
          client_id?: string
          company_name?: string | null
          company_news?: string | null
          company_size?: string | null
          company_website?: string | null
          created_at?: string | null
          email?: string | null
          first_contact_at?: string | null
          first_name?: string | null
          geography?: string | null
          hot_score?: number | null
          icebreaker_used?: string | null
          icp_id?: string | null
          id?: string
          industry?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          linkedin_summary?: string | null
          linkedin_url?: string | null
          notes?: string | null
          notion_page_id?: string | null
          reply_received_at?: string | null
          source?: string | null
          stage?: string | null
          title?: string | null
          trigger_event?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_icp_id_fkey"
            columns: ["icp_id"]
            isOneToOne: false
            referencedRelation: "icp_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          created_at: string | null
          discipline: string
          id: string
          messages: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discipline: string
          id?: string
          messages?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discipline?: string
          id?: string
          messages?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_intel: {
        Row: {
          action_suggested: string | null
          client_id: string
          detected_at: string | null
          embedding: string | null
          headline: string | null
          id: string
          relevance_score: number | null
          source_url: string | null
          summary: string | null
          type: string | null
        }
        Insert: {
          action_suggested?: string | null
          client_id: string
          detected_at?: string | null
          embedding?: string | null
          headline?: string | null
          id?: string
          relevance_score?: number | null
          source_url?: string | null
          summary?: string | null
          type?: string | null
        }
        Update: {
          action_suggested?: string | null
          client_id?: string
          detected_at?: string | null
          embedding?: string | null
          headline?: string | null
          id?: string
          relevance_score?: number | null
          source_url?: string | null
          summary?: string | null
          type?: string | null
        }
        Relationships: []
      }
      mira_project_access: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mira_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      mira_projects: {
        Row: {
          agents_count: number | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agents_count?: number | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agents_count?: number | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mira_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mira_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mira_users"
            referencedColumns: ["id"]
          },
        ]
      }
      mira_sections: {
        Row: {
          color: string | null
          description: string | null
          is_released: boolean | null
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          description?: string | null
          is_released?: boolean | null
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          description?: string | null
          is_released?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      mira_subscriptions: {
        Row: {
          client_id: string
          ends_at: string | null
          id: string
          plan: string | null
          section_slug: string
          starts_at: string | null
          status: string | null
        }
        Insert: {
          client_id: string
          ends_at?: string | null
          id?: string
          plan?: string | null
          section_slug: string
          starts_at?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string
          ends_at?: string | null
          id?: string
          plan?: string | null
          section_slug?: string
          starts_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mira_subscriptions_section_slug_fkey"
            columns: ["section_slug"]
            isOneToOne: false
            referencedRelation: "mira_sections"
            referencedColumns: ["slug"]
          },
        ]
      }
      mira_usage_log: {
        Row: {
          cache_creation_tokens: number
          cache_read_tokens: number
          client_id: string
          created_at: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          route: string
          used_client_key: boolean
        }
        Insert: {
          cache_creation_tokens?: number
          cache_read_tokens?: number
          client_id: string
          created_at?: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          route: string
          used_client_key?: boolean
        }
        Update: {
          cache_creation_tokens?: number
          cache_read_tokens?: number
          client_id?: string
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          route?: string
          used_client_key?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mira_usage_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      mira_users: {
        Row: {
          auth_id: string
          billing_contact_email: string | null
          company_name: string
          created_at: string | null
          email: string
          id: string
          role: string
          subscription_status: string
          subscription_tier: string
          updated_at: string | null
        }
        Insert: {
          auth_id: string
          billing_contact_email?: string | null
          company_name: string
          created_at?: string | null
          email: string
          id?: string
          role?: string
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string
          billing_contact_email?: string | null
          company_name?: string
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      oauth_sessions: {
        Row: {
          client_id: string
          code_verifier: string | null
          created_at: string
          expires_at: string
          id: number
          return_to: string | null
          state: string
          tool: string
          user_id: string | null
        }
        Insert: {
          client_id: string
          code_verifier?: string | null
          created_at?: string
          expires_at: string
          id?: number
          return_to?: string | null
          state: string
          tool: string
          user_id?: string | null
        }
        Update: {
          client_id?: string
          code_verifier?: string | null
          created_at?: string
          expires_at?: string
          id?: number
          return_to?: string | null
          state?: string
          tool?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          id: string
          messages: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          messages?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          messages?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_log: {
        Row: {
          body: string | null
          channel: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          outcome: string | null
          replied_at: string | null
          sent_at: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          channel?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          outcome?: string | null
          replied_at?: string | null
          sent_at?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          channel?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          outcome?: string | null
          replied_at?: string | null
          sent_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      post_history: {
        Row: {
          approved_by: string | null
          client_id: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          performance: Json | null
          pillar_id: string | null
          platform: string
          posted_at: string | null
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          client_id: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          performance?: Json | null
          pillar_id?: string | null
          platform: string
          posted_at?: string | null
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          client_id?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          performance?: Json | null
          pillar_id?: string | null
          platform?: string
          posted_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      project_memory: {
        Row: {
          action_id: string | null
          category: string
          client_id: string
          created_at: string | null
          created_by: string | null
          full_content: Json | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          project_id: string | null
          source_department: string | null
          summary: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_id?: string | null
          category: string
          client_id: string
          created_at?: string | null
          created_by?: string | null
          full_content?: Json | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          project_id?: string | null
          source_department?: string | null
          summary: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_id?: string | null
          category?: string
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          full_content?: Json | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          project_id?: string | null
          source_department?: string | null
          summary?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_memory_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "quick_actions_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memory_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mira_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_library: {
        Row: {
          client_id: string
          created_at: string | null
          embedding: string | null
          id: string
          loss_reason: string | null
          outcome: string | null
          problem_solved: string | null
          prospect_industry: string | null
          prospect_size: string | null
          raw_content: string | null
          services_proposed: string[] | null
          total_value_usd: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          loss_reason?: string | null
          outcome?: string | null
          problem_solved?: string | null
          prospect_industry?: string | null
          prospect_size?: string | null
          raw_content?: string | null
          services_proposed?: string[] | null
          total_value_usd?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          loss_reason?: string | null
          outcome?: string | null
          problem_solved?: string | null
          prospect_industry?: string | null
          prospect_size?: string | null
          raw_content?: string | null
          services_proposed?: string[] | null
          total_value_usd?: number | null
        }
        Relationships: []
      }
      prospect_context: {
        Row: {
          company_data: Json | null
          id: string
          intent_signals: string[] | null
          lead_id: string | null
          linkedin_data: Json | null
          recent_news: string[] | null
          scraped_at: string | null
          social_signals: Json | null
        }
        Insert: {
          company_data?: Json | null
          id?: string
          intent_signals?: string[] | null
          lead_id?: string | null
          linkedin_data?: Json | null
          recent_news?: string[] | null
          scraped_at?: string | null
          social_signals?: Json | null
        }
        Update: {
          company_data?: Json | null
          id?: string
          intent_signals?: string[] | null
          lead_id?: string | null
          linkedin_data?: Json | null
          recent_news?: string[] | null
          scraped_at?: string | null
          social_signals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_context_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_answers: {
        Row: {
          answered_by: string | null
          client_id: string
          id: string
          question_id: string
          status: string
          updated_at: string
          value: Json
        }
        Insert: {
          answered_by?: string | null
          client_id: string
          id?: string
          question_id: string
          status?: string
          updated_at?: string
          value: Json
        }
        Update: {
          answered_by?: string | null
          client_id?: string
          id?: string
          question_id?: string
          status?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_answers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_questions: {
        Row: {
          help: string | null
          id: string
          kind: string
          maps_to: string | null
          options: Json | null
          position: number
          prompt: string
          questionnaire_id: string
          required: boolean
          section: string | null
        }
        Insert: {
          help?: string | null
          id?: string
          kind?: string
          maps_to?: string | null
          options?: Json | null
          position: number
          prompt: string
          questionnaire_id: string
          required?: boolean
          section?: string | null
        }
        Update: {
          help?: string | null
          id?: string
          kind?: string
          maps_to?: string | null
          options?: Json | null
          position?: number
          prompt?: string
          questionnaire_id?: string
          required?: boolean
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_questions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "client_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_actions_results: {
        Row: {
          action_type: string
          client_id: string
          created_at: string | null
          department: string
          error_message: string | null
          google_drive_file_id: string | null
          google_drive_url: string | null
          id: string
          input_data: Json
          liked_by_user: boolean | null
          memory_note: string | null
          memory_saved: boolean | null
          output_data: Json
          output_type: string | null
          processing_time_ms: number | null
          resource_name: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          client_id: string
          created_at?: string | null
          department: string
          error_message?: string | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          input_data: Json
          liked_by_user?: boolean | null
          memory_note?: string | null
          memory_saved?: boolean | null
          output_data: Json
          output_type?: string | null
          processing_time_ms?: number | null
          resource_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          client_id?: string
          created_at?: string | null
          department?: string
          error_message?: string | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          input_data?: Json
          liked_by_user?: boolean | null
          memory_note?: string | null
          memory_saved?: boolean | null
          output_data?: Json
          output_type?: string | null
          processing_time_ms?: number | null
          resource_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_actions_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_results: {
        Row: {
          alternatives: Json | null
          client_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          data_version: string | null
          error_code: string | null
          errors: Json | null
          http_status: number | null
          id: string
          quote_id: string | null
          raw_response: Json | null
          recommended: Json | null
          request_snapshot: Json
          schema_version: string | null
          shipment_id: string
          status: string
          trace_id: string | null
          warnings: Json | null
        }
        Insert: {
          alternatives?: Json | null
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          data_version?: string | null
          error_code?: string | null
          errors?: Json | null
          http_status?: number | null
          id?: string
          quote_id?: string | null
          raw_response?: Json | null
          recommended?: Json | null
          request_snapshot: Json
          schema_version?: string | null
          shipment_id: string
          status: string
          trace_id?: string | null
          warnings?: Json | null
        }
        Update: {
          alternatives?: Json | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          data_version?: string | null
          error_code?: string | null
          errors?: Json | null
          http_status?: number | null
          id?: string
          quote_id?: string | null
          raw_response?: Json | null
          recommended?: Json | null
          request_snapshot?: Json
          schema_version?: string | null
          shipment_id?: string
          status?: string
          trace_id?: string | null
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_results_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "quote_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_shipments: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          declared_value_eur: number | null
          destination_country: string | null
          destination_postal_code: string | null
          destination_rating_area: string | null
          extras: Json | null
          id: string
          missing: Json
          notes: string | null
          origin_country: string | null
          origin_postal_code: string | null
          origin_rating_area: string | null
          packages: Json
          palletized: boolean | null
          service: string
          shipment_ref: string
          status: string
          ticket_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          declared_value_eur?: number | null
          destination_country?: string | null
          destination_postal_code?: string | null
          destination_rating_area?: string | null
          extras?: Json | null
          id?: string
          missing?: Json
          notes?: string | null
          origin_country?: string | null
          origin_postal_code?: string | null
          origin_rating_area?: string | null
          packages?: Json
          palletized?: boolean | null
          service?: string
          shipment_ref: string
          status?: string
          ticket_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          declared_value_eur?: number | null
          destination_country?: string | null
          destination_postal_code?: string | null
          destination_rating_area?: string | null
          extras?: Json | null
          id?: string
          missing?: Json
          notes?: string | null
          origin_country?: string | null
          origin_postal_code?: string | null
          origin_rating_area?: string | null
          packages?: Json
          palletized?: boolean | null
          service?: string
          shipment_ref?: string
          status?: string
          ticket_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_shipments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_shipments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "email_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_library: {
        Row: {
          added_at: string | null
          client_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          pillar_id: string | null
          platform: string
          quality_score: number | null
          raw_content: string | null
          source_type: string
          url: string | null
          why_it_works: string | null
        }
        Insert: {
          added_at?: string | null
          client_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          pillar_id?: string | null
          platform: string
          quality_score?: number | null
          raw_content?: string | null
          source_type: string
          url?: string | null
          why_it_works?: string | null
        }
        Update: {
          added_at?: string | null
          client_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          pillar_id?: string | null
          platform?: string
          quality_score?: number | null
          raw_content?: string | null
          source_type?: string
          url?: string | null
          why_it_works?: string | null
        }
        Relationships: []
      }
      section_access_rules: {
        Row: {
          allowed: boolean
          created_at: string | null
          section_slug: string
          tier: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string | null
          section_slug: string
          tier: string
        }
        Update: {
          allowed?: boolean
          created_at?: string | null
          section_slug?: string
          tier?: string
        }
        Relationships: []
      }
      tender_settings: {
        Row: {
          client_id: string
          playbook: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          playbook?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          playbook?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          criteria: Json | null
          deadline: string | null
          expediente: string | null
          id: string
          memoria: Json | null
          oferta: Json | null
          organo: string | null
          pliego_text: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          criteria?: Json | null
          deadline?: string | null
          expediente?: string | null
          id?: string
          memoria?: Json | null
          oferta?: Json | null
          organo?: string | null
          pliego_text?: string | null
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          criteria?: Json | null
          deadline?: string | null
          expediente?: string | null
          id?: string
          memoria?: Json | null
          oferta?: Json | null
          organo?: string | null
          pliego_text?: string | null
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_connections: {
        Row: {
          account_email: string | null
          account_handle: string | null
          auth_token: string | null
          client_id: string
          connected_at: string | null
          created_at: string | null
          disconnected_at: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["tool_status"] | null
          tool_id: string
          updated_at: string | null
        }
        Insert: {
          account_email?: string | null
          account_handle?: string | null
          auth_token?: string | null
          client_id: string
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["tool_status"] | null
          tool_id: string
          updated_at?: string | null
        }
        Update: {
          account_email?: string | null
          account_handle?: string | null
          auth_token?: string | null
          client_id?: string
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["tool_status"] | null
          tool_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_requests: {
        Row: {
          client_id: string
          created_at: string
          handled_at: string | null
          id: string
          message: string | null
          requested_by: string | null
          status: string
          tool_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          handled_at?: string | null
          id?: string
          message?: string | null
          requested_by?: string | null
          status?: string
          tool_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          handled_at?: string | null
          id?: string
          message?: string | null
          requested_by?: string | null
          status?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_runs: {
        Row: {
          client_slug: string
          created_at: string
          id: string
          inputs: Json
          output_html: string | null
          status: string
          tool_name: string
        }
        Insert: {
          client_slug: string
          created_at?: string
          id?: string
          inputs?: Json
          output_html?: string | null
          status?: string
          tool_name: string
        }
        Update: {
          client_slug?: string
          created_at?: string
          id?: string
          inputs?: Json
          output_html?: string | null
          status?: string
          tool_name?: string
        }
        Relationships: []
      }
      tool_setup_progress: {
        Row: {
          client_id: string
          critical_tools_connected: number | null
          id: string
          last_checked: string | null
          setup_percentage: number | null
          total_critical_tools: number | null
        }
        Insert: {
          client_id: string
          critical_tools_connected?: number | null
          id?: string
          last_checked?: string | null
          setup_percentage?: number | null
          total_critical_tools?: number | null
        }
        Update: {
          client_id?: string
          critical_tools_connected?: number | null
          id?: string
          last_checked?: string | null
          setup_percentage?: number | null
          total_critical_tools?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_setup_progress_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_log: {
        Row: {
          api_cost_usd: number | null
          client_id: string | null
          created_at: string | null
          id: string
          records_fetched: number | null
          run_id: string | null
          source: string | null
        }
        Insert: {
          api_cost_usd?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          records_fetched?: number | null
          run_id?: string | null
          source?: string | null
        }
        Update: {
          api_cost_usd?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          records_fetched?: number | null
          run_id?: string | null
          source?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_topics: Json | null
          current_level: number | null
          current_module: string | null
          discipline: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_topics?: Json | null
          current_level?: number | null
          current_module?: string | null
          discipline: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_topics?: Json | null
          current_level?: number | null
          current_module?: string | null
          discipline?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_templates: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          nombre: string
          performance_score: number | null
          platform: string
          preview_url: string | null
          style: string
          uso_count: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          nombre: string
          performance_score?: number | null
          platform: string
          preview_url?: string | null
          style: string
          uso_count?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          nombre?: string
          performance_score?: number | null
          platform?: string
          preview_url?: string | null
          style?: string
          uso_count?: number | null
        }
        Relationships: []
      }
      visual_assets: {
        Row: {
          asset_type: string
          client_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          value: string | null
        }
        Insert: {
          asset_type: string
          client_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          value?: string | null
        }
        Update: {
          asset_type?: string
          client_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      win_loss_history: {
        Row: {
          client_id: string
          competitor_lost_to: string | null
          created_at: string | null
          deal_size_usd: number | null
          id: string
          loss_factors: string[] | null
          notes: string | null
          objections_handled: string[] | null
          objections_raised: string[] | null
          outcome: string | null
          prospect_company: string | null
          sales_cycle_days: number | null
          win_factors: string[] | null
        }
        Insert: {
          client_id: string
          competitor_lost_to?: string | null
          created_at?: string | null
          deal_size_usd?: number | null
          id?: string
          loss_factors?: string[] | null
          notes?: string | null
          objections_handled?: string[] | null
          objections_raised?: string[] | null
          outcome?: string | null
          prospect_company?: string | null
          sales_cycle_days?: number | null
          win_factors?: string[] | null
        }
        Update: {
          client_id?: string
          competitor_lost_to?: string | null
          created_at?: string | null
          deal_size_usd?: number | null
          id?: string
          loss_factors?: string[] | null
          notes?: string | null
          objections_handled?: string[] | null
          objections_raised?: string[] | null
          outcome?: string | null
          prospect_company?: string | null
          sales_cycle_days?: number | null
          win_factors?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      knowledge_items: {
        Row: {
          agent_role: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          id: string | null
          project_id: string | null
          source: string | null
          summary: string | null
          title: string | null
          url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_client_id: { Args: never; Returns: string }
      current_user_client_slug: { Args: never; Returns: string }
      current_workspace_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      search_references: {
        Args: {
          p_client_id: string
          p_limit?: number
          p_pillar_id: string
          p_query_embedding: string
        }
        Returns: {
          id: string
          platform: string
          raw_content: string
          similarity: number
          source_type: string
          why_it_works: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      tool_status: "connected" | "disconnected" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tool_status: ["connected", "disconnected", "pending"],
    },
  },
} as const
