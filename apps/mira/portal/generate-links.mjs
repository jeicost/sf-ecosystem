import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REDIRECT_TO = 'https://portal-six-kappa-22.vercel.app/reset-password';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('📧 Generating recovery links with production redirect...\n');

  const { data: nataliaLink, error: nataliaError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: 'natalia.aldea@albasanzexpress.es',
    options: { redirectTo: REDIRECT_TO }
  });

  const { data: alessandroLink, error: alessandroError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: 'alessandro@discoolver.com',
    options: { redirectTo: REDIRECT_TO }
  });

  if (nataliaError || alessandroError) {
    console.error('❌ Error:', nataliaError?.message || alessandroError?.message);
    process.exit(1);
  }

  console.log('🔗 RECOVERY LINKS FOR PRODUCTION\n');
  console.log('Share these links with the users:\n');
  console.log('📧 Natalia (Dadybox)');
  console.log('Email: natalia.aldea@albasanzexpress.es');
  console.log('Link:');
  console.log(nataliaLink.properties.action_link);
  console.log('\n---\n');
  console.log('📧 Alessandro (Discoolver)');
  console.log('Email: alessandro@discoolver.com');
  console.log('Link:');
  console.log(alessandroLink.properties.action_link);
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
