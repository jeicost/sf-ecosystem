import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Verificando usuarios...\n');

  // Get both users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('❌ Error fetching users:', error.message);
    process.exit(1);
  }

  const natalia = users.find(u => u.email === 'natalia.aldea@albasanzexpress.es');
  const alessandro = users.find(u => u.email === 'alessandro@discoolver.com');

  if (!natalia) {
    console.error('❌ Natalia not found');
    process.exit(1);
  }
  if (!alessandro) {
    console.error('❌ Alessandro not found');
    process.exit(1);
  }

  console.log('✅ Natalia found:', natalia.id);
  console.log('   Client ID:', natalia.user_metadata?.client_id);
  console.log('   Plan:', natalia.user_metadata?.plan);
  console.log('');
  console.log('✅ Alessandro found:', alessandro.id);
  console.log('   Client ID:', alessandro.user_metadata?.client_id);
  console.log('   Plan:', alessandro.user_metadata?.plan);
  console.log('\n📧 Generating recovery links...\n');

  // Generate recovery links
  const { data: nataliaLink, error: nataliaError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: 'natalia.aldea@albasanzexpress.es'
  });

  const { data: alessandroLink, error: alessandroError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: 'alessandro@discoolver.com'
  });

  if (nataliaError) {
    console.error('❌ Error generating Natalia link:', nataliaError.message);
    process.exit(1);
  }
  if (alessandroError) {
    console.error('❌ Error generating Alessandro link:', alessandroError.message);
    process.exit(1);
  }

  console.log('🔗 RECOVERY LINKS (copy and send to users):');
  console.log('');
  console.log('Natalia (Dadybox):');
  console.log(nataliaLink.properties.action_link);
  console.log('');
  console.log('Alessandro (Discoolver):');
  console.log(alessandroLink.properties.action_link);
  console.log('');
  console.log('✅ Links generated successfully');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
