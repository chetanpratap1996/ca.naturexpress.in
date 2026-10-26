const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://uesllnkjrbpmynihvlvy.supabase.co',
  'sb_publishable_6gMbtVkt9KiTJrKWCvDJbw_FvSTSWek'
);

async function testSdk() {
  const [
    { data: firms, error: fErr },
    { data: entities, error: eErr },
    { data: groups, error: gErr },
    { data: tasks, error: tErr },
    { data: invoices, error: iErr },
    { data: dsc, error: dErr }
  ] = await Promise.all([
    sb.from('firms').select('*'),
    sb.from('client_entities').select('*'),
    sb.from('client_groups').select('*'),
    sb.from('compliance_tasks').select('*'),
    sb.from('invoices').select('*'),
    sb.from('dsc_vault').select('*')
  ]);

  console.log('Firms fetched:', firms?.length, fErr || 'No error');
  console.log('Entities fetched:', entities?.length, eErr || 'No error');
  console.log('Groups fetched:', groups?.length, gErr || 'No error');
  console.log('Tasks fetched:', tasks?.length, tErr || 'No error');
  console.log('Invoices fetched:', invoices?.length, iErr || 'No error');
  console.log('DSC tokens fetched:', dsc?.length, dErr || 'No error');
}

testSdk().catch(console.error);
