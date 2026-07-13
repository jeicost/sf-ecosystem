const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://nnevhtfxuawexliwlbmh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZXZodGZ4dWF3ZXhsaXdsYm1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk0NTM1NSwiZXhwIjoyMDkzNTIxMzU1fQ.JxsSSJ8ptY73XvuGvQxM6tS8IB0LY__xIokcPcisasE');

(async () => {
  const { data } = await supabase.from('generation_queue').select('*').order('created_at', { ascending: false }).limit(1);
  if (data?.[0]) {
    const row = data[0];
    console.log('\n=== ÚLTIMA GENERACIÓN ===');
    console.log(`ID: ${row.id}`);
    console.log(`Tool: ${row.tool_slug}`);
    console.log(`Status: ${row.status}`);
    console.log(`Error: ${row.error_message || 'None'}`);
    if (row.result_data) {
      console.log(`\n✅ RESULT DATA FOUND:`);
      console.log(JSON.stringify(row.result_data, null, 2).slice(0, 500));
    } else {
      console.log(`\n❌ NO RESULT DATA`);
    }
  }
})();
