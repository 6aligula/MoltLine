import { createContainer } from './bootstrap/container';
import { createServer } from './adapters/http/server';

const port = parseInt(process.env.PORT ?? '8080', 10);

const container = createContainer();
const app = createServer(container.userRepo);

app.listen(port, () => {
  console.log(`MoldLine Auth API listening on port ${port}`);
});
