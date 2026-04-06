import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tnkofoarfyudzojkioos.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRua29mb2FyZnl1ZHpvamtpb29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDc0MjcsImV4cCI6MjA4OTEyMzQyN30.1wn8O0HAODsFr8H6iKPuSLmj9R7FZ8zvr1IhnNJzNCE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)