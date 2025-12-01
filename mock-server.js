// mock-server.js
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'bchavezos@ucvvirtual.edu.pe' && password === 'contraseña') {
    return res.status(200).json({ message: 'Login OK' });
  }
  return res.status(401).json({ message: 'Credenciales incorrectas' });
});

app.listen(8081, () => console.log('Mock API en http://127.0.0.1:8081'));
