import express from 'express';
import controllerRouting from './routes/index';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

controllerRouting(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;