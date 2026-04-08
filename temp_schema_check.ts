import db from './src/db';

async function checkSchemas() {
    const { data: cData, error: cErr } = await db.from('categories').select('*').limit(1);
    const { data: mData, error: mErr } = await db.from('menus').select('*').limit(1);

    console.log('Categories error:', cErr?.message || 'None');
    console.log('Categories columns:', cData?.[0] ? Object.keys(cData[0]).join(', ') : 'no rows found');
    
    console.log('Menus error:', mErr?.message || 'None');
    console.log('Menus columns:', mData?.[0] ? Object.keys(mData[0]).join(', ') : 'no rows found');

    process.exit(0);
}

checkSchemas();
