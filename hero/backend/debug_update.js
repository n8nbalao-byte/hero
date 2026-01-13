const db = require('./src/database');

async function testUpdate() {
  try {
    const userId = 5; // loja1@teste.com
    console.log('Testing update for user', userId);

    const payload = {
      name: 'Numero 1 Informatica Updated',
      category: 'Informatica',
      address: 'Av. Francisco Glicério, 1000 - Centro',
      phone: '19999999999',
      description: 'Updated Description',
      opening_hours: '{"mon":{"open":true,"from":"09:00","to":"18:00"}}',
      imageUrl: 'https://via.placeholder.com/150?text=Loja1',
      latitude: -22.90556,
      longitude: -47.06083,
      banner_url: 'https://via.placeholder.com/800x200?text=Banner+Loja1',
      primary_color: '#0000FF',
      secondary_color: '#333333',
      openai_key: 'sk-test-key'
    };

    const sql = `
        UPDATE stores SET 
          name = ?, category = ?, address = ?, phone = ?, description = ?, 
          opening_hours = ?, imageUrl = ?, latitude = ?, longitude = ?,
          banner_url = ?, primary_color = ?, secondary_color = ?, openai_key = ?
        WHERE user_id = ?
      `;

    const values = [
      payload.name,
      payload.category,
      payload.address,
      payload.phone,
      payload.description,
      payload.opening_hours,
      payload.imageUrl,
      payload.latitude,
      payload.longitude,
      payload.banner_url,
      payload.primary_color,
      payload.secondary_color,
      payload.openai_key,
      userId
    ];

    console.log('Executing query...');
    const [result] = await db.query(sql, values);
    console.log('Update result:', result);

  } catch (error) {
    console.error('Update FAILED:', error);
  } finally {
    process.exit();
  }
}

testUpdate();
