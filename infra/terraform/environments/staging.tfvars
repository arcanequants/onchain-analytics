# Staging Environment Configuration
# AI Perception Engineering Agency

environment   = "staging"
project_name  = "ai-perception-staging"
domain        = "staging.aiperception.agency"

# Sensitive values should be set via environment variables:
# - TF_VAR_vercel_api_token
# - TF_VAR_supabase_access_token
# - TF_VAR_supabase_anon_key
# - TF_VAR_supabase_service_role_key
# - TF_VAR_openai_api_key
# - TF_VAR_anthropic_api_key
# - TF_VAR_cron_secret

# Non-sensitive values - staging Supabase project
supabase_project_url     = "https://staging-placeholder.supabase.co"
supabase_organization_id = "org_placeholder"
vercel_team_id           = null
