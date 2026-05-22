const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://taytjixivurgretofvne.supabase.co';
const supabaseKey = 'sb_publishable_IM6mhchloDp9-vaCaSS8bw_OLd_Wera';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('company').select('name, website_url, linkedin_url, twitter_handle').limit(5);
    
    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log('Sample Data:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Catch Error:', err.message);
  }
}

test();
