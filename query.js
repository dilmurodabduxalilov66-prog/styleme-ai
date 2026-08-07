const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:styleme_db_pass_123@postgres:5432/postgres' });
pool.query('SELECT user_id, work_hours FROM barber_profiles LIMIT 1;')
  .then(res => { 
    console.log(JSON.stringify(res.rows, null, 2)); 
    process.exit(0); 
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
